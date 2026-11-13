import {useState} from 'react';
import {Box, Button, Toolbar, Typography} from '@mui/material';
import {useSnackbar} from 'notistack';
import RemoteConnectDialog, {remoteError} from './remoteConnectDialog';
import SshTerminal from './sshTerminal';
import SftpBrowser from './sftpBrowser';

export default function RemoteWorkspace({device}: any) {
    const [connecting, setConnecting] = useState(false);
    const {enqueueSnackbar} = useSnackbar();
    const notify = (message: string, variant: any = 'error') => enqueueSnackbar(message, {variant});
    return <Box sx={{height: '100%', display: 'flex', flexDirection: 'column', minHeight: 0}}>
        <Toolbar variant="dense" sx={{gap: 1}}>
            <Typography noWrap title={`${device.name} (${device.address})`} sx={{flex: 1, minWidth: 0}} variant="body2">{device.name}</Typography>
            <Typography variant="caption" color={device.state ? 'success.main' : 'text.secondary'} sx={{whiteSpace: 'nowrap'}}>{device.state ? '已连接' : '未连接'}</Typography>
            <Button sx={{whiteSpace: 'nowrap'}} onClick={() => device.state
                ? window.api.send('device/closeDevice', device.address).catch((error: any) => notify(remoteError(error)))
                : setConnecting(true)}>{device.state ? '断开连接' : '连接'}</Button>
        </Toolbar>
        <Box sx={{flex: 1, minHeight: 0, overflow: 'hidden'}}>
            {device.deviceChannelType === 5 ? <SshTerminal device={device} onError={notify}/> : device.state ? <SftpBrowser device={device} notify={notify}/> : <Typography sx={{p: 3}} color="text.secondary">连接 SFTP 后浏览远端文件</Typography>}
        </Box>
        {connecting && <RemoteConnectDialog device={device} close={() => setConnecting(false)}/>}
    </Box>;
}
