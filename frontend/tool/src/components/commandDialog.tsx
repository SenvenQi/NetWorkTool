import React, {Component} from 'react';
import {Button, Dialog, DialogActions, DialogContent, DialogTitle, TextField} from '@mui/material'
import {CommandType} from "../models/commandType";

class CommandDialog extends Component<any> {
    state = {
        name: '',
        type: CommandType.Buffer,
        command: ''
    }

    render() {
        return (
            <Dialog open={this.props.open} onClose={this.props.pending ? undefined : this.props.close}>
                <DialogTitle>添加命令</DialogTitle>
                <DialogContent>
                    <TextField
                        fullWidth sx={{p: 1}}
                        value={this.state.name}
                        onChange={(event) => this.setState({name: event.target.value})}
                        label="名称" placeholder="名称"
                        variant="standard"/>
                    <TextField fullWidth sx={{p: 1}}
                               select
                               label="编码" value={this.state.type}
                               onChange={(event) => this.setState({type:Number(event.target.value)}) }
                               variant="standard"
                               SelectProps={{
                                   native: true
                               }}>
                        {[{name: "16进制字符串", value: CommandType.Buffer},{name: "纯字符串", value: CommandType.String}].map((option) => (
                            <option key={option.value} value={option.value}>
                                {option.name}
                            </option>
                        ))}
                    </TextField>
                    <TextField
                        fullWidth sx={{p: 1}}
                        value={this.state.command}
                        onChange={(event) => this.setState({command: event.target.value})}
                        label="命令" placeholder="命令"
                        variant="standard"/>
                </DialogContent>
                <DialogActions>
                    <Button disabled={this.props.pending} onClick={this.props.close}>取消</Button>
                    <Button disabled={this.props.pending}
                        onClick={() => this.props.handleSubmite(this.state.name, this.state.type, this.state.command)}>{this.props.pending ? "保存中…" : "确定"}</Button>
                </DialogActions>
            </Dialog>
        );
    }
}

export default CommandDialog;