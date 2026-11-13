import * as React from 'react';
import Button from '@mui/material/Button';
import TextField from '@mui/material/TextField';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogTitle from '@mui/material/DialogTitle';
import {DeviceType} from '../models/deviceType';
import {DeviceChannelType} from '../models/deviceChannelType';

export default function FormDialog(props:any) {
  const [name, setName] = React.useState("");
  const [address, setAddress] = React.useState("");
  const [options, setOptions] = React.useState<any>({});
  const buadRates = [115200,57600,38400,19200,9600,4800,2400,1800,1200,600,300,200,150,134,110,75,50];
  const [deviceType] = React.useState(DeviceType.base);
  const [deviceChannelType, setDeviceChannelType] = React.useState(DeviceChannelType.Socket);
  const renderOption = () => {
     if (deviceChannelType === DeviceChannelType.Ssh || deviceChannelType === DeviceChannelType.Sftp) {
         return <TextField fullWidth sx={{p: 1}} label="默认用户名（可选）" value={options.username || ""} onChange={event => setOptions({username: event.target.value})} helperText="认证信息在连接时填写，不保存密码或私钥"/>;
     }
     if (deviceChannelType === DeviceChannelType.Serialport){
             return <TextField fullWidth sx={{p:1}}
                               select
                    value={options.baudRate}
				    onChange={(event) => setOptions({...options,baudRate:parseInt(event.target.value)})}
                    SelectProps={{
                                   native:true
                               }
                           }
                    label="波特率"
			    	variant="standard" >
                 {
                     buadRates.map((item,index)=>{
                         return <option key={item} value={item}>
                             {item}
                         </option>
                     })
                 }
                </TextField>
     }
     if (deviceChannelType === DeviceChannelType.UdpDevice) {
         return <>
             <TextField fullWidth sx={{p:1}} label="目标地址" value={options.remoteAddress ?? "255.255.255.255"}
                 onChange={event => setOptions({...options, remoteAddress: event.target.value})} />
             <TextField fullWidth sx={{p:1}} label="目标端口" type="number" value={options.remotePort ?? 1500}
                 onChange={event => setOptions({...options, remotePort: Number(event.target.value)})} />
         </>;
     }
     return null;
  }

  const changeDeviceChannelType = (channelType:DeviceChannelType)=>{
      setDeviceChannelType(channelType);
      setAddress("");
      setOptions(channelType === DeviceChannelType.UdpDevice ? {remoteAddress: "255.255.255.255", remotePort: 1500} : {});
      if (channelType === DeviceChannelType.Serialport){
        setOptions({
            baudRate:9600,
            stopBits: 1,
            dataBits: 8,
            parity:'none',
        })
      }
  }
  const renderAddress = () => {
		if (deviceChannelType === DeviceChannelType.Serialport) {
			return <TextField fullWidth sx={{p:1}}
					select
					variant="standard"
					value={address}
                    label="地址"
					onChange={(event) => setAddress(event.target.value)}
					SelectProps={{
						native:true
					}}>
					<option value={""}>
						请选择串口
					</option>
					{props.ports.map((option:any) => (
						<option key={option.path} value={option.path}>
							{option.path}
						</option>
					))}
				</TextField>
		}else if(deviceChannelType === DeviceChannelType.HidDevice){
            return  <TextField fullWidth sx={{p:1}}
					select
					variant="standard"
					value={address}
                    label="地址"
					onChange={(event) => setAddress(event.target.value)}
					SelectProps={{
						native:true
					}}>
					<option value={""}>
						请选择HID设备
					</option>
					{props.hidPaths.map((option:any) => (
						<option key={option.path} value={option.path}>
							{option.product}
						</option>
					))}
				</TextField>
        }
        else {
			return <TextField fullWidth sx={{p:1}}
				value={address}
                    label="地址"
				onChange={(event) => setAddress(event.target.value)}
				placeholder={deviceChannelType === DeviceChannelType.Socket ? "host:port 或 [IPv6]:port" : deviceChannelType >= DeviceChannelType.Ssh ? "服务器地址，默认端口 22" : "本地监听端口"}
				variant="standard" />
		}
	}

  return (
      <Dialog open={props.open} onClose={props.pending ? undefined : props.handleOpen}>
        <DialogTitle>添加配置</DialogTitle>
        <DialogContent>
			<TextField
				fullWidth sx={{p:1}}
				value={name}
                onChange={(event) => setName(event.target.value)}
				label="名称" placeholder="名称"
				variant="standard" />
			<TextField fullWidth sx={{p:1}}
				select
				label="协议"
                value={deviceChannelType}
                onChange={(event) => changeDeviceChannelType(Number(event.target.value) as DeviceChannelType)}
				variant="standard"
				SelectProps={{
					native:true
				}}>
				 {[{name:"Tcp客户端",value:DeviceChannelType.Socket},{name:"串口客户端",value:DeviceChannelType.Serialport},{name:"http监听",value:DeviceChannelType.HttpServer},{name:"hid设备",value:DeviceChannelType.HidDevice},{name:"udp设备",value:DeviceChannelType.UdpDevice},{name:"SSH 终端",value:DeviceChannelType.Ssh},{name:"SFTP 文件传输",value:DeviceChannelType.Sftp}].map((option) => (
                    <option key={option.value} value={option.value}>
                    {option.name}
                    </option>
                ))}
			</TextField>
			{
				renderAddress()
			}
            {
                renderOption()
            }
        </DialogContent>
        <DialogActions>
          <Button disabled={props.pending} onClick={props.handleOpen}>取消</Button>
          <Button disabled={props.pending} onClick={()=>props.handleSubmite(name,address,deviceType,deviceChannelType,options)}>{props.pending ? "保存中…" : "确定"}</Button>
        </DialogActions>
      </Dialog>
  );
}
