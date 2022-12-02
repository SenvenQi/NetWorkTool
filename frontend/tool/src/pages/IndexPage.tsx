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

const AnimatedBox = animated(StyledBox)
const AnimatedCard = animated(Card)

const Home = (props: any) => {
    const [open, setOpen] = useState(false);
    const [message, setMessage] = useState('');
    const [openCommand, setOpenCommand] = useState(false);
    const [openCommandDialog, setOpenCommandDialog] = useState(false);

    useEffect(() => {
        props.initData();
    }, [])
    const handleOpen = () => {
        if (!open) {
            props.getPorts();
            props.getHidDevices();
        }
        setOpen(!open)
    }

    const handleSelect = (device: any) => {
        props.selectDevice(device)
    }

    const handleRemove = () => {
        if(props.selectedDevice?.address){
            props.removeDevice(props.selectedDevice.address);
        }
    }

    const handleAddCommand = (name: string, type: CommandType, command: string) => {
        if (name && name.trim() !== "" && command && command.trim() !== "")
            props.addCommand({name, type, command})
        else
            props.enqueueSnackbar(
                "信息输入存在空值",
                {
                    key: new Date().getTime() + Math.random(),
                    variant:'error'
                }
            )
    }

    const showCommand = () => {
            return <Spring to={{opacity: openCommand ? 1 : 0,width:openCommand ? 300 : 0}}>
                {
                    (styles:any) => <AnimatedBox style={styles} sx={{borderLeft: '1px solid rgba(255,255,255,0.12)'}}>
                        <StyledBox sx={{height: "calc(100% - 55px)", overflow: 'auto'}}>
                            <Command data={props.commands} open={openCommandDialog}
                                     sendMessage={(message: any) => props.sendMessage({
                                         address: props.selectedDevice.address,
                                         message
                                     })}/>
                        </StyledBox>

                        <Toolbar variant="dense">
                            <Typography
                                component="div"
                                sx={{flexGrow: 1}}
                            >
                            </Typography>
                            <IconButton size="small" aria-label="add" onClick={() => setOpenCommandDialog(true)}
                                        color="inherit">
                                <Add/>
                            </IconButton>
                            <IconButton size="small" aria-label="remove" onClick={() => {
                            }} color="inherit">
                                <Remove/>
                            </IconButton>
                        </Toolbar>
                        <CommandDialog open={openCommandDialog} handleSubmite={handleAddCommand}
                                       close={() => setOpenCommandDialog(false)}/>
                    </AnimatedBox>
                }
            </Spring>
    }

    const renderForm = () => {
        if (props.selectedDevice) {
            return <>
                <Toolbar variant="dense">
                    <Typography
                        variant='body2'
                        noWrap
                        component="div"
                        sx={{maxWidth: 100}}
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
                <StyledCard variant="outlined" sx={{height: "calc(100% - 96px)", width: "100%"}}>
                    <CardContent style={{padding: 0}} sx={{height: "100%"}}>
                        <Box sx={{display: 'flex', height: "100%"}}>
                            <StyledBox sx={{flexGrow: 1, height: "100%", overflow: "auto"}}>{
                                props.messages.filter((item: any) => item.address == props.selectedDevice.address).map((message: any, index: number) => {
                                    return <Spring key={index} from={{opacity:0,scale:0}}  to={{opacity:1,scale:1}}>
                                        { (styles:any) =>  <AnimatedCard style={styles} sx={{m: 1}} variant="outlined" key={`ListItem-${index}`}>
                                            <CardContent>
                                                <Box>
                                                    <Chip size={"small"}
                                                          label={moment(message.time).format('YYYY-MM-DD hh:mm:ss')}
                                                          component={"div"} color="success"/>
                                                </Box>
                                                <Paper sx={{p: 1, mt: 1}}>
                                                    <Typography
                                                        component={"strong"}>{props.selectedDevice.deviceChannelType == DeviceChannelType.HttpServer ? message.message : Array.prototype.map.call(message.message, (x: number) => '0x' + (('00' + x.toString(16)).slice(-2))).join(' ')}</Typography>
                                                </Paper>
                                            </CardContent>
                                            <CardActions disableSpacing>
                                                <Button onClick={() => props.copyText(message.message)}
                                                        size="small">复制数组到剪切板</Button>
                                            </CardActions>
                                        </AnimatedCard>}
                                    </Spring>
                                })
                            }</StyledBox>
                            <Box sx={{
                                maxWidth: 350,
                                display: props.selectedDevice.deviceChannelType === DeviceChannelType.HttpServer ? "none" : "flex"
                            }}>
                                {
                                    showCommand()
                                }
                                <Box sx={{borderLeft: '1px solid', borderColor: 'rgba(255,255,255,0.12)'}}>
                                    <List sx={{p: 0}}>
                                        {['Inbox', 'Starred', 'Send email', 'Drafts'].map((text, index) => (
                                            <ListItem key={text} sx={{p: 0}}>
                                                <IconButton onClick={() => setOpenCommand(!openCommand)}>
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
                    <InputBase
                        sx={{ml: 1, flex: 1}}
                        placeholder="16进制字符串"
                        inputProps={{'aria-label': '16进制字符串'}}
                        value={message}
                        onChange={(event) => {
                            const regex = /^[0-9a-fA-F]+$/;
                            if (event.target.value === '' || regex.test(event.target.value)) {
                                setMessage(event.target.value);
                            }
                        }}
                        onKeyDown={(event) => {
                            if (event.key == 'Enter')
                                props.sendMessage({address: props.selectedDevice.address, message})
                        }}
                    />
                    <IconButton size="small" type="submit" onClick={() => {
                        props.sendMessage({address: props.selectedDevice.address, message});
                    }
                    } aria-label="发送">
                        <Send/>
                    </IconButton>
                </Toolbar>
            </>
        } else {
            return null;
        }
    }

    const addDevice = (name: string, address: string, deviceType: DeviceType, deviceChannelType: DeviceChannelType, options: any) => {
        if (props.devices.find((x: any) => x.address == address)) {
                props.enqueueSnackbar('不可添加同地址设备', {variant: 'error'});
        } else {
            if (name && name.trim() !== "" && address && address.trim() !== "") {
                props.addDevice({
                    deviceType: deviceType,
                    name: name,
                    deviceChannelType: deviceChannelType,
                    address: address,
                    option: options
                });
                setOpen(false);
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
            <Paper sx={{borderRadius: 0, height: "100%", overflow: "hidden", width: 360}}>
                <Box sx={{height: "calc(100% - 48px)", overflowY: "auto", width: "100%"}}>
                    <Device data={props.devices} selected={props.selectedDevice} handleClick={handleSelect}/>
                </Box>
                <Toolbar variant="dense">
                    <Typography
                        component="div"
                        sx={{flexGrow: 1}}
                    >
                    </Typography>
                    <IconButton size="small" aria-label="add" onClick={handleOpen} color="inherit">
                        <Add/>
                    </IconButton>
                    <IconButton size="small" aria-label="remove" onClick={handleRemove} color="inherit">
                        <Remove/>
                    </IconButton>
                </Toolbar>
            </Paper>

            <Paper sx={{height: "100%", overflow: "hidden", width: "calc(100% - 360px)"}}>
                {
                    renderForm()
                }
            </Paper>
            <DeviceDialog open={open} ports={props.ports} hidPaths={props.hidPaths} handleOpen={() => setOpen(!open)}
                          handleSubmite={addDevice}/>
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
        commands: state.device.commands
    }
}

export default connect(mapStateToProps, mapDispatchToProps)(withSnackbar(Home))

