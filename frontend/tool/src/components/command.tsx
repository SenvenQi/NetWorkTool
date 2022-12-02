import React from "react";
import {Button, Card, CardActions, CardContent, List, ListItem, styled, Typography} from "@mui/material";

const StyledList = styled(List)(({theme}) => ({
    backgroundColor: theme.palette.background.paper,
    borderRadius: 0,
    '&::-webkit-scrollbar': {
        width: '0.6em'
    },
    '&::-webkit-scrollbar-thumb': {
        backgroundColor: theme.palette.action.hover
    }
}))


export class Command extends React.Component<any> {
    render() {
        return <StyledList sx={{flexGrow: 1, margin: 1}}>
            {
                this.props.data.map((item: any) => {
                    return <ListItem key={item.id}>
                        <Card sx={{width: "100%"}}>
                            <CardContent>
                                <Typography component={'strong'} variant={'body2'} color={'text.secondary'}>
                                    {item.name}
                                </Typography>
                                <Typography>
                                    {Array.prototype.map.call(item.hexString, (x: number) => '0x' + (('00' + x.toString(16)).slice(-2))).join(' ')}
                                </Typography>
                            </CardContent>
                            <CardActions>
                                <Button size={"small"}
                                        onClick={this.props.sendMessage.bind(this, item.hexString)}>发送</Button>
                            </CardActions>
                        </Card>
                    </ListItem>
                })
            }
        </StyledList>
    }
}
