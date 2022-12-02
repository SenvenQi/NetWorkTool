import React, {Component} from 'react';
import {Button, Dialog, DialogActions, DialogContent, DialogTitle, TextField} from '@mui/material'
import {CommandType} from "../models/commandType";

class CommandDialog extends Component<any> {
    state = {
        name: '',
        type: CommandType.Buffer,
        command: ''
    }

    constructor(context: any) {
        super(context);
    }

    render() {
        return (
            <Dialog open={this.props.open} onClose={this.props.close}>
                <DialogTitle>添加命令</DialogTitle>
                <DialogContent>
                    <TextField
                        fullWidth sx={{p: 1}}
                        value={this.state.name}
                        onChange={(event) => this.setState({name: event.target.value})}
                        placeholder="名称"
                        variant="standard"/>
                    <TextField fullWidth sx={{p: 1}}
                               select
                               value={this.state.type}
                               onChange={(event) => this.setState({type:event.target.value}) }
                               variant="standard"
                               SelectProps={{
                                   native: true
                               }}>
                        {[{name: "2进制字符串", value: CommandType.Buffer},{name: "纯字符串", value: CommandType.String}].map((option) => (
                            <option key={option.value} value={option.value}>
                                {option.name}
                            </option>
                        ))}
                    </TextField>
                    <TextField
                        fullWidth sx={{p: 1}}
                        value={this.state.command}
                        onChange={(event) => this.setState({command: event.target.value})}
                        placeholder="命令"
                        variant="standard"/>
                </DialogContent>
                <DialogActions>
                    <Button onClick={this.props.close}>取消</Button>
                    <Button
                        onClick={() => this.props.handleSubmite(this.state.name, this.state.type, this.state.command)}>确定</Button>
                </DialogActions>
            </Dialog>
        );
    }
}

export default CommandDialog;