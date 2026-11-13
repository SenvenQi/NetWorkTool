import {useEffect, useState} from 'react';
import {Alert, Button, Checkbox, Dialog, DialogActions, DialogContent, DialogTitle, FormControlLabel, Stack, TextField, Typography} from '@mui/material';

export const remoteError = (error: any) => (error.message || String(error)).replace(/^Error invoking remote method '[^']+': (?:Error: )?/, '');

export default function RemoteConnectDialog({device, close}: any) {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [privateKey, setPrivateKey] = useState('');
    const [passphrase, setPassphrase] = useState('');
    const [method, setMethod] = useState('password');
    const [fingerprint, setFingerprint] = useState('');
    const [confirmed, setConfirmed] = useState(false);
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(true);
    const [connecting, setConnecting] = useState(false);
    const [attempt, setAttempt] = useState(0);
    useEffect(() => {
        let active = true;
        setLoading(true); setError(''); setFingerprint(''); setConfirmed(false);
        window.api.send('device/inspectSshHost', device.address).then((result: any) => {
            if (active) { setFingerprint(result.fingerprint); setUsername(value => value || result.username); }
        }).catch((error: any) => { if (active) setError(remoteError(error)); }).finally(() => { if (active) setLoading(false); });
        return () => { active = false; };
    }, [device.address, attempt]);
    const connect = async () => {
        setConnecting(true); setError('');
        try {
            await window.api.send('device/connectRemote', {address: device.address, auth: {
                username, hostKey: fingerprint, ...(method === 'password' ? {password} : {privateKey, passphrase})
            }});
            close();
        } catch (error) { setError(remoteError(error)); }
        finally { setConnecting(false); }
    };
    const cancel = async () => {
        if (connecting) await window.api.send('device/closeDevice', device.address).catch(() => {});
        close();
    };
    return <Dialog open onClose={cancel} fullWidth maxWidth="sm">
        <DialogTitle>连接 {device.deviceChannelType === 5 ? 'SSH' : 'SFTP'}</DialogTitle>
        <DialogContent><Stack spacing={2} sx={{pt: 1}}>
            <Typography variant="body2" sx={{overflowWrap: 'anywhere'}}>{device.address}</Typography>
            {error && <Alert severity="error">{error}</Alert>}
            {loading ? <Typography>正在获取服务器指纹…</Typography> : fingerprint ? <>
                <Typography variant="body2">请通过可信渠道核对服务器公钥指纹：</Typography>
                <Typography variant="body2" sx={{fontFamily: 'monospace', overflowWrap: 'anywhere'}}>{fingerprint}</Typography>
                <FormControlLabel control={<Checkbox checked={confirmed} disabled={connecting} onChange={event => setConfirmed(event.target.checked)}/>} label="已核对服务器指纹"/>
            </> : <Button onClick={() => setAttempt(value => value + 1)}>重试获取指纹</Button>}
            <TextField label="用户名" value={username} disabled={connecting} onChange={event => setUsername(event.target.value)} autoComplete="off"/>
            <TextField label="认证方式" select SelectProps={{native: true}} value={method} disabled={connecting} onChange={event => setMethod(event.target.value)}>
                <option value="password">密码</option><option value="key">私钥</option>
            </TextField>
            {method === 'password' ? <TextField label="密码" type="password" value={password} disabled={connecting} onChange={event => setPassword(event.target.value)} autoComplete="new-password"/> : <>
                <Button disabled={connecting} onClick={async () => {
                    try { const key = await window.api.send('device/chooseSshKey'); if (key) setPrivateKey(key.content); }
                    catch (error) { setError(remoteError(error)); }
                }}>选择私钥文件</Button>
                <TextField label="私钥内容" multiline minRows={3} maxRows={5} value={privateKey} disabled={connecting} onChange={event => setPrivateKey(event.target.value)}/>
                <TextField label="私钥口令（可选）" type="password" value={passphrase} disabled={connecting} onChange={event => setPassphrase(event.target.value)} autoComplete="new-password"/>
            </>}
            <Typography variant="caption" color="text.secondary">密码、私钥和口令仅用于本次连接，不保存到设备配置。</Typography>
        </Stack></DialogContent>
        <DialogActions><Button onClick={cancel}>取消</Button><Button onClick={connect} disabled={connecting || loading || !confirmed || !username.trim() || !(method === 'password' ? password : privateKey)}>{connecting ? '连接中…' : '连接'}</Button></DialogActions>
    </Dialog>;
}
