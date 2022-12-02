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
     if (deviceChannelType == DeviceChannelType.Serialport){
             return <TextField fullWidth sx={{p:1}}
                               select
                    value={options.baudRate}
				    onChange={(event) => setOptions({...options,baudRate:parseInt(event.target.value)})}
                    SelectProps={{
                                   native:true
                               }
                           }
			    	placeholder="波特率"
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
     return null;
  }

  const changeDeviceChannelType = (channelType:DeviceChannelType)=>{
      setDeviceChannelType(channelType);
      if (channelType == DeviceChannelType.Serialport){
        setOptions({
            baudRate:9600,
            stopBits: 1,
            dataBits: 8,
            parity:'none',
        })
      }
  }
  const renderAddress = () => {
		if (deviceChannelType == DeviceChannelType.Serialport) {
			return <TextField fullWidth sx={{p:1}}
					select
					variant="standard"
					value={address}
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
		}else if(deviceChannelType == DeviceChannelType.HidDevice){
            return  <TextField fullWidth sx={{p:1}}
					select
					variant="standard"
					value={address}
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
				onChange={(event) => setAddress(event.target.value)}
				placeholder="地址"
				variant="standard" />
		}
	}

  return (
      <Dialog open={props.open} onClose={props.handleOpen}>
        <DialogTitle>添加配置</DialogTitle>
        <DialogContent>
			<TextField
				fullWidth sx={{p:1}}
				value={name}
                onChange={(event) => setName(event.target.value)}
				placeholder="名称"
				variant="standard" />
			<TextField fullWidth sx={{p:1}}
				select
				value={deviceChannelType}
                onChange={(event) => changeDeviceChannelType(event.target.value as unknown as DeviceChannelType)}
				variant="standard"
				SelectProps={{
					native:true
				}}>
				 {[{name:"Tcp客户端",value:DeviceChannelType.Socket},{name:"串口客户端",value:DeviceChannelType.Serialport},{name:"http监听",value:DeviceChannelType.HttpServer},{name:"hid设备",value:DeviceChannelType.HidDevice},{name:"udp设备",value:DeviceChannelType.UdpDevice}].map((option) => (
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
          <Button onClick={props.handleOpen}>取消</Button>
          <Button onClick={()=>props.handleSubmite(name,address,deviceType,deviceChannelType,options)}>确定</Button>
        </DialogActions>
      </Dialog>
  );
}
