import {useEffect, useRef, useState} from 'react';
import {Box, Button, Dialog, DialogActions, DialogContent, DialogTitle, LinearProgress, Stack, Table, TableBody, TableCell, TableHead, TableRow, TextField, Typography} from '@mui/material';
import {remoteError} from './remoteConnectDialog';

type Entry = {name: string; size: number; modified: number; directory: boolean; link: boolean};
const join = (base: string, name: string) => `${base.replace(/\/$/, '')}/${name}`;
const sizeLabel = (size: number) => size < 1024 ? `${size} B` : size < 1024 * 1024 ? `${(size / 1024).toFixed(1)} KiB` : `${(size / 1024 / 1024).toFixed(1)} MiB`;

export default function SftpBrowser({device, notify}: any) {
    const [directory, setDirectory] = useState('.');
    const [pathInput, setPathInput] = useState('.');
    const [entries, setEntries] = useState<Entry[]>([]);
    const [selected, setSelected] = useState<Entry | null>(null);
    const [busy, setBusy] = useState(false);
    const [transfer, setTransfer] = useState<any>(null);
    const [operation, setOperation] = useState('');
    const [name, setName] = useState('');
    const generation = useRef(0);
    const alive = useRef(true);
    useEffect(() => {
        alive.current = true;
        const unsubscribe = window.api.receive('PackageMessage', (event: any) => {
            if (event.type === 'REMOTE_TRANSFER' && event.data.address === device.address) setTransfer(event.data);
        });
        return () => { alive.current = false; generation.current++; unsubscribe(); };
    }, [device.address]);
    const load = async (target: string) => {
        const token = ++generation.current;
        setBusy(true);
        try {
            const result = await window.api.send('device/sftpAction', {address: device.address, action: 'list', path: target});
            if (alive.current && generation.current === token) { setDirectory(result.path); setPathInput(result.path); setEntries(result.entries); setSelected(null); }
        } catch (error) { if (alive.current && generation.current === token) notify(remoteError(error), 'error'); }
        finally { if (alive.current && generation.current === token) setBusy(false); }
    };
    useEffect(() => {
        if (device.state) void load('.');
        else { generation.current++; setEntries([]); setSelected(null); setBusy(false); }
        // A reconnect starts at the account's home directory.
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [device.state]);
    const transferFile = async (direction: string) => {
        setBusy(true); setTransfer(null);
        try {
            const result = await window.api.send('device/sftpTransfer', {address: device.address, direction, path: direction === 'upload' ? directory : join(directory, selected!.name)});
            if (result && alive.current) { notify(direction === 'upload' ? '上传完成' : '下载完成', 'success'); await load(directory); }
        } catch (error) { if (alive.current) notify(remoteError(error), 'error'); }
        finally { if (alive.current) setBusy(false); }
    };
    const mutate = async () => {
        if (operation !== 'remove' && (!name.trim() || name.includes('/') || name.includes('\0') || name === '.' || name === '..')) {
            notify('请输入有效名称，不能包含 /', 'error'); return;
        }
        setBusy(true);
        try {
            await window.api.send('device/sftpAction', {address: device.address, action: operation,
                path: operation === 'mkdir' ? join(directory, name) : join(directory, selected!.name), destination: join(directory, name)});
            if (alive.current) { setOperation(''); await load(directory); }
        } catch (error) { if (alive.current) notify(remoteError(error), 'error'); }
        finally { if (alive.current) setBusy(false); }
    };
    if (!device.state) return <Typography sx={{p: 3}} color="text.secondary">连接 SFTP 后浏览远端文件</Typography>;
    const transferring = transfer?.status === 'running';
    return <Stack sx={{height: '100%', minHeight: 0}}>
        <Stack direction="row" spacing={1} sx={{p: 1}}>
            <Button disabled={busy || directory === '/'} onClick={() => load(join(directory, '..'))}>上级</Button>
            <TextField label="远端路径" size="small" value={pathInput} disabled={busy} onChange={event => setPathInput(event.target.value)} onKeyDown={event => { if (event.key === 'Enter') void load(pathInput); }} sx={{flex: 1, minWidth: 0}}/>
            <Button disabled={busy} onClick={() => load(pathInput)}>前往</Button>
        </Stack>
        <Stack direction="row" useFlexGap flexWrap="wrap" spacing={0.5} sx={{px: 1, pb: 1}}>
            <Button disabled={busy} onClick={() => load(directory)}>刷新</Button>
            <Button disabled={busy} onClick={() => transferFile('upload')}>上传</Button>
            <Button disabled={busy || !selected || selected.directory} onClick={() => transferFile('download')}>下载</Button>
            <Button disabled={busy} onClick={() => { setName(''); setOperation('mkdir'); }}>新建目录</Button>
            <Button disabled={busy || !selected} onClick={() => { setName(selected!.name); setOperation('rename'); }}>重命名</Button>
            <Button disabled={busy || !selected} color="error" onClick={() => setOperation('remove')}>删除</Button>
        </Stack>
        {busy && !transferring && <LinearProgress/>}
        <Box sx={{flex: 1, minHeight: 0, overflow: 'auto'}}>
            <Table size="small" aria-label="远端文件" sx={{tableLayout: 'fixed'}}>
                <TableHead><TableRow><TableCell>名称（双击打开目录）</TableCell><TableCell sx={{width: 110, whiteSpace: "nowrap"}}>大小</TableCell></TableRow></TableHead>
                <TableBody>{entries.map(entry => <TableRow key={entry.name} hover selected={selected?.name === entry.name} tabIndex={busy ? -1 : 0}
                    onClick={() => { if (!busy) setSelected(entry); }} onDoubleClick={() => { if (!busy && (entry.directory || entry.link)) void load(join(directory, entry.name)); }}
                    onKeyDown={event => { if (!busy && event.key === 'Enter') { setSelected(entry); if (entry.directory || entry.link) void load(join(directory, entry.name)); } }} sx={{cursor: 'pointer'}}>
                    <TableCell title={entry.name} sx={{overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap'}}>{entry.directory ? '📁 ' : entry.link ? '↗ ' : ''}{entry.name}</TableCell>
                    <TableCell sx={{whiteSpace: "nowrap"}}>{entry.directory ? '目录' : sizeLabel(entry.size)}</TableCell>
                </TableRow>)}</TableBody>
            </Table>
            {!busy && entries.length === 0 && <Typography sx={{p: 2}} color="text.secondary">目录为空</Typography>}
        </Box>
        {transfer && <Box sx={{p: 1}}>
            <LinearProgress variant="determinate" value={transfer.total ? Math.min(100, transfer.completed / transfer.total * 100) : transfer.status === 'complete' ? 100 : 0}/>
            <Stack direction="row" alignItems="center" justifyContent="space-between">
                <Typography variant="caption">{transfer.direction === 'upload' ? '上传' : '下载'} {sizeLabel(transfer.completed)} / {sizeLabel(transfer.total)} · {({running: '传输中', complete: '已完成', cancelled: '已取消', failed: '失败'} as Record<string, string>)[transfer.status]}</Typography>
                {transferring && <Button size="small" onClick={() => window.api.send('device/cancelSftpTransfer', device.address).catch((error: any) => notify(remoteError(error), 'error'))}>取消传输</Button>}
            </Stack>
        </Box>}
        <Dialog open={!!operation} onClose={busy ? undefined : () => setOperation('')} fullWidth maxWidth="xs">
            <DialogTitle>{({mkdir: '新建目录', rename: '重命名', remove: '确认删除'} as Record<string, string>)[operation]}</DialogTitle>
            <DialogContent>{operation === 'remove' ? <Typography sx={{overflowWrap: 'anywhere'}}>删除“{selected?.name}”？目录仅支持删除空目录。</Typography>
                : <TextField autoFocus fullWidth label="新名称" sx={{mt: 1}} value={name} disabled={busy} onChange={event => setName(event.target.value)}/>}</DialogContent>
            <DialogActions><Button disabled={busy} onClick={() => setOperation('')}>取消</Button><Button disabled={busy} color={operation === 'remove' ? 'error' : 'primary'} onClick={mutate}>确定</Button></DialogActions>
        </Dialog>
    </Stack>;
}
