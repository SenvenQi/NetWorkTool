import {bindActionCreators} from 'redux'
import {
    Box,
    Button,
    Card,
    CardActions,
    CardContent,
    Chip,
    IconButton,
    InputBase,
    ListItem,
    Paper,
    Toolbar,
    Typography
} from '@mui/material';

import {connect} from 'react-redux';
import {
    addCommand,
    addDevice,
    clearDeviceMessage,
    connectDevice,
    copyText,
    disConnectDevice,
    getHidDevice,
    getPorts,
    initData,
    removeDevice,
    selectDevice,
    sendMessage
} from '../stores/device/actions';
import Device from '../components/device';
import RemoteWorkspace from '../components/remoteWorkspace';
import DeviceDialog from '../components/deviceDialog';
import Add from '@mui/icons-material/Add';
import Remove from '@mui/icons-material/Remove';
import Send from '@mui/icons-material/Send';
import {useEffect, useState} from 'react';
import {styled} from '@mui/material/styles';
import {DeviceType} from '../models/deviceType';
import {DeviceChannelType} from '../models/deviceChannelType';
import {withSnackbar} from 'notistack';
import moment from 'moment';
import {Command} from "../components/command";
import List from "@mui/material/List";
import {Home as HomeIcon} from "@mui/icons-material"
import CommandDialog from "../components/commandDialog";
import {CommandType} from "../models/commandType";
import {Spring, animated} from '@react-spring/web';


const StyledCard = styled(Card)(({theme}) => ({
    backgroundColor: theme.palette.background.paper,
    borderRadius: 0,
    '&::-webkit-scrollbar': {
        width: '0.6em'
    },
    '&::-webkit-scrollbar-thumb': {
        backgroundColor: theme.palette.action.hover
    }
}))

const StyledBox = styled(Box)(({theme}) => ({
    backgroundColor: theme.palette.background.paper,
    borderRadius: 0,
    '&::-webkit-scrollbar': {
        width: '0.6em'
    },
    '&::-webkit-scrollbar-thumb': {
        backgroundColor: theme.palette.action.hover
    }
}))

const AnimatedCard = animated(Card)

const Home = (props: any) => {
    const [open, setOpen] = useState(false);
    const [message, setMessage] = useState('');
    const [openCommand, setOpenCommand] = useState(false);
    const [openCommandDialog, setOpenCommandDialog] = useState(false);

    useEffect(() => { if (props.deviceSaveStatus === "success") setOpen(false); }, [props.deviceSaveStatus]);
    useEffect(() => { if (props.commandSaveStatus === "success") setOpenCommandDialog(false); }, [props.commandSaveStatus]);
    const canSend = props.selectedDevice?.state && props.selectedDevice.deviceChannelType !== DeviceChannelType.HttpServer;
    const { initData } = props;
    useEffect(() => { initData(); }, [initData]);
    const handleOpen = () => {
        if (!open) {
            props.getPorts();
            props.getHidDevices();
        }
        setOpen(!open)
    }

    const send = (value: any) => {
        if (!props.selectedDevice?.state || props.selectedDevice.deviceChannelType === DeviceChannelType.HttpServer) {
            props.enqueueSnackbar("请先连接可发送数据的设备", {variant: "error"});
            return;
        }
        props.sendMessage({address: props.selectedDevice.address, message: value});
    };

    const handleSelect = (device: any) => {
        props.selectDevice(device)
    }

    const handleRemove = () => {
        if(props.selectedDevice?.address){
            props.removeDevice(props.selectedDevice.address);
        }
    }

    const handleAddCommand = (name: string, type: CommandType, command: string) => {
        if (name && name.trim() !== "" && command && command.trim() !== "") {
            props.addCommand({name, type, command});
        } else
            props.enqueueSnackbar(
                "信息输入存在空值",
                {
                    key: new Date().getTime() + Math.random(),
                    variant:'error'
                }
            )
    }

    const showCommand = () => openCommand && <Paper elevation={8} aria-label="常用命令面板"
        sx={{position: 'absolute', top: 0, bottom: 0, right: 40, width: 'min(300px, calc(100% - 40px))', zIndex: 1}}>
        <StyledBox sx={{height: 'calc(100% - 48px)', overflow: 'auto'}}>
            <Command data={props.commands} sendMessage={send} disabled={!canSend}/>
        </StyledBox>
        <Toolbar variant="dense" sx={{justifyContent: 'space-between'}}>
            <Typography variant="body2">常用命令</Typography>
            <IconButton size="small" aria-label="添加命令" onClick={() => setOpenCommandDialog(true)} color="inherit"><Add/></IconButton>
        </Toolbar>
    </Paper>;

    const renderForm = () => {
        if ([DeviceChannelType.Ssh, DeviceChannelType.Sftp].includes(props.selectedDevice?.deviceChannelType)) return <RemoteWorkspace key={props.selectedDevice.address} device={props.selectedDevice}/>;
        if (props.selectedDevice) {
            return <>
                <Toolbar variant="dense" sx={{px: 1, gap: 1, whiteSpace: "nowrap"}}>
                    <Typography
                        variant='body2'
                        noWrap
                        component="div"
                        sx={{minWidth: 0, flex: 1}}
                        title={`${props.selectedDevice.name} (${props.selectedDevice.address})`}
                    >
                        {props.selectedDevice.name}({props.selectedDevice.address})
                    </Typography>
                    <Typography
                        variant='body2'
                        noWrap
                        component="div"
                        sx={{flexGrow: 1}}
                    >
                    </Typography>
                    <Button onClick={() => {
                        props.clearDeviceMessage(props.selectedDevice.address)
                    }}>清空</Button>
                    <Button onClick={() => {
                        if (props.selectedDevice.state) {
                            props.disConnectDevice(props.selectedDevice.address)
                        } else {
                            props.connectDevice(props.selectedDevice)
                        }
                    }}>{props.selectedDevice.state ? "断开连接" : "连接"}</Button>
                </Toolbar>
                <StyledCard variant="outlined" sx={{height: "calc(100% - 96px)", width: "100%", minWidth: 0}}>
                    <CardContent style={{padding: 0}} sx={{height: "100%"}}>
                        <Box sx={{display: 'flex', height: "100%", position: 'relative'}}>
                            <StyledBox sx={{flexGrow: 1, minWidth: 0, height: "100%", overflow: "auto"}}>{
                                props.messages.filter((item: any) => item.address === props.selectedDevice.address).map((message: any, index: number) => {
                                    return <Spring key={index} from={{opacity:0,scale:0}}  to={{opacity:1,scale:1}}>
                                        { (styles:any) =>  <AnimatedCard style={styles} sx={{m: 1}} variant="outlined" key={`ListItem-${index}`}>
                                            <CardContent>
                                                <Box>
                                                    <Chip size={"small"}
                                                          label={moment(message.time).format('YYYY-MM-DD HH:mm:ss')}
                                                          component={"div"} color="success"/>
                                                </Box>
                                                <Paper sx={{p: 1, mt: 1}}>
                                                    <Typography
                                                        sx={{overflowWrap: "anywhere", whiteSpace: "pre-wrap"}} component={"strong"}>{props.selectedDevice.deviceChannelType === DeviceChannelType.HttpServer ? message.message : Array.prototype.map.call(message.message, (x: number) => '0x' + (('00' + x.toString(16)).slice(-2))).join(' ')}</Typography>
                                                </Paper>
                                            </CardContent>
                                            <CardActions disableSpacing>
                                                <Button onClick={() => props.copyText(message.message)}
                                                        size="small">{props.selectedDevice.deviceChannelType === DeviceChannelType.HttpServer ? "复制文本" : "复制数组到剪切板"}</Button>
                                            </CardActions>
                                        </AnimatedCard>}
                                    </Spring>
                                })
                            }</StyledBox>
                            <Box sx={{
                                flexShrink: 0, width: 40,
                                display: props.selectedDevice.deviceChannelType === DeviceChannelType.HttpServer ? "none" : "flex"
                            }}>
                                {
                                    showCommand()
                                }
                                <Box sx={{borderLeft: '1px solid', borderColor: 'rgba(255,255,255,0.12)'}}>
                                    <List sx={{p: 0}}>
                                        {['常用命令'].map((text, index) => (
                                            <ListItem key={text} sx={{p: 0}}>
                                                <IconButton aria-label="常用命令" aria-expanded={openCommand} onClick={() => setOpenCommand(!openCommand)}>
                                                    <HomeIcon/>
                                                </IconButton>
                                            </ListItem>
                                        ))}
                                    </List>
                                </Box>
                            </Box>
                        </Box>
                    </CardContent>
                </StyledCard>
                <Toolbar variant="dense">
                    {props.selectedDevice.deviceChannelType === DeviceChannelType.HttpServer
                        ? <Typography variant="body2" color="text.secondary">{props.selectedDevice.state ? "正在监听 HTTP 请求" : "连接后开始监听 HTTP 请求"}</Typography>
                        : <><InputBase
                        sx={{ml: 1, flex: 1, minWidth: 0}}
                        disabled={!canSend}
                        placeholder="16进制字符串"
                        inputProps={{'aria-label': '16进制字符串'}}
                        value={message}
                        onChange={(event) => {
                            const regex = /^[0-9a-fA-F\s]+$/;
                            if (event.target.value === '' || regex.test(event.target.value)) {
                                setMessage(event.target.value);
                            }
                        }}
                        onKeyDown={(event) => {
                            if (event.key === 'Enter')
                                send(message)
                        }}
                    />
                    <IconButton size="small" disabled={!canSend || !message.trim()} type="submit" onClick={() => {
                        send(message);
                    }
                    } aria-label="发送">
                        <Send/>
                    </IconButton></>}
                </Toolbar>
            </>
        } else {
            return <Box sx={{p: 3, color: "text.secondary"}}>添加或选择设备，开始通信测试</Box>;
        }
    }

    const addDevice = (name: string, address: string, deviceType: DeviceType, deviceChannelType: DeviceChannelType, options: any) => {
        if (props.devices.find((x: any) => x.address === address.trim())) {
                props.enqueueSnackbar('不可添加同地址设备', {variant: 'error'});
        } else {
            if (name && name.trim() !== "" && address && address.trim() !== "") {
                props.addDevice({
                    deviceType: deviceType,
                    name: name.trim(),
                    deviceChannelType: deviceChannelType,
                    address: address.trim(),
                    option: options
                });
            } else
                props.enqueueSnackbar(
                    "信息输入存在空值",
                    {
                        key: new Date().getTime() + Math.random(),
                        variant: 'error'
                    }
                )
        }
    }

    return (
        <Box sx={{height: "100%", display: "flex"}}>
            <Paper sx={{borderRadius: 0, height: "100%", overflow: "hidden", width: "clamp(180px, 28vw, 280px)", flexShrink: 0}}>
                <Box sx={{height: "calc(100% - 48px)", overflowY: "auto", width: "100%"}}>
                    <Device data={props.devices} selected={props.selectedDevice} handleClick={handleSelect}/>
                </Box>
                <Toolbar variant="dense">
                    <Typography
                        component="div"
                        sx={{flexGrow: 1}}
                    >
                    </Typography>
                    <IconButton size="small" aria-label="添加设备" onClick={handleOpen} color="inherit">
                        <Add/>
                    </IconButton>
                    <IconButton size="small" aria-label="删除设备" disabled={!props.selectedDevice} onClick={handleRemove} color="inherit">
                        <Remove/>
                    </IconButton>
                </Toolbar>
            </Paper>

            <Paper sx={{height: "100%", overflow: "hidden", flex: 1, minWidth: 0}}>
                {
                    renderForm()
                }
            </Paper>
            <DeviceDialog open={open} pending={props.deviceSaveStatus === "pending"} ports={props.ports} hidPaths={props.hidPaths} handleOpen={() => setOpen(!open)}
                          handleSubmite={addDevice}/>
            <CommandDialog open={openCommandDialog} pending={props.commandSaveStatus === "pending"}
                handleSubmite={handleAddCommand} close={() => setOpenCommandDialog(false)}/>
        </Box>
    )
}


const mapDispatchToProps = (dispatch: any) => {
    return {
        initData: bindActionCreators(initData, dispatch),
        sendMessage: bindActionCreators(sendMessage, dispatch),
        addDevice: bindActionCreators(addDevice, dispatch),
        selectDevice: bindActionCreators(selectDevice, dispatch),
        connectDevice: bindActionCreators(connectDevice, dispatch),
        removeDevice: bindActionCreators(removeDevice, dispatch),
        getPorts: bindActionCreators(getPorts, dispatch),
        disConnectDevice: bindActionCreators(disConnectDevice, dispatch),
        clearDeviceMessage: bindActionCreators(clearDeviceMessage, dispatch),
        getHidDevices: bindActionCreators(getHidDevice, dispatch),
        copyText: bindActionCreators(copyText, dispatch),
        addCommand: bindActionCreators(addCommand, dispatch)
    }
}

const mapStateToProps = (state: any) => {
    return {
        devices: state.device.devices,
        messages: state.device.messages,
        selectedDevice: state.device.selectedDevice,
        ports: state.device.ports,
        hidPaths: state.device.hidPaths,
        commands: state.device.commands,
        deviceSaveStatus: state.device.deviceSaveStatus,
        commandSaveStatus: state.device.commandSaveStatus
    }
}

export default connect(mapStateToProps, mapDispatchToProps)(withSnackbar(Home))

