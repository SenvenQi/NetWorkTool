import React from 'react';
import {
    List,
    ListItem,
    ListItemText,
    ListItemAvatar,
    Avatar,
    Badge,
    Divider,
    ListItemButton,
    Box,
    Typography
} from '@mui/material';
import Computer from '@mui/icons-material/Computer';
import IDevice from '../models/device';


export default function FolderList(props:{data:IDevice[],handleClick:any,selected:IDevice}) {
  return (
    <List disablePadding sx={{ width: '100%', bgcolor: 'background.paper' }}>
		{
			props.data?.map((item,index)=>{
			   return	<Box key={index}><ListItem disablePadding>
						<ListItemButton selected={item.address === props.selected?.address} onClick={() => props.handleClick(item)}>
							<ListItemAvatar>
									<Avatar variant="square" sx={{background:"none",color:"white"}}>
										<Badge color="success" variant="dot" badgeContent=" " invisible={!item.state}>
											<Computer />
										</Badge>
									</Avatar>
							</ListItemAvatar>
							<ListItemText primary={item.name} secondary={<Typography noWrap={true}>{item.address}</Typography>} />
						</ListItemButton>
					</ListItem>
					<Divider key={`Divider-${index}`} component="li" />
				</Box>
			})}

    </List>
  );
}
