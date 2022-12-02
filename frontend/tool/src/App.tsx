import './styles/globals.css'

import React from 'react';
import { ThemeProvider } from '@mui/material/styles';
import theme from './styles/mainTheme';
import { bindActionCreators } from 'redux'
import { connect } from 'react-redux';
import Layout from './components/layout';
import Routers from "./Router";
import { push } from './stores/router/actions';
import {withSnackbar} from "notistack";
import {MessageType} from "./models/messageType";
import {actionTypes} from "./stores/device/actions";
class MyApp extends React.Component<any> {
    componentDidMount(){
        window.api.receive("PackageMessage",(data:any)=> {
            if(data.type === actionTypes.RECIVE_MESSAGE && data.data.message?.info)
                this.props.enqueueSnackbar(
                    data.data.message.info,
                    {
                        key: new Date().getTime() + Math.random(),
                        variant:data.data.messageType == MessageType.Error? 'error': 'success',
                    }
                )
            this.props.callAction(data);
        })
    }
    render() {
        return <ThemeProvider theme={theme}>
            <Layout data={this.props.pages} push={this.props.push}>
                <Routers/>
            </Layout>
        </ThemeProvider>
    }
}

const mapDispatchToProps = (dispatch:any) => {
    return {
        push: bindActionCreators(push, dispatch),
        callAction:(data:any)=>{
            dispatch(data);
        }
    }
}


const mapStateToProps = (state:any) => {
    return {
        pages: state.router.pages,
    }
  }


export default connect(mapStateToProps,mapDispatchToProps)(withSnackbar(MyApp));
