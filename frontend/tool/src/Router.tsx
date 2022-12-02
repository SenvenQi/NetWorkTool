import React from 'react';
import { connect } from 'react-redux';


class Routers extends React.Component<any> {
  render() {
      const Component = this.props.pages.find((x:any)=> x.path==this.props.path).component;
      return <Component/>
    }
}


const mapStateToProps = (state:any) => {
  return {
      path: state.router.path,
      pages: state.router.pages
  }
}

export default connect(mapStateToProps,null)(Routers);




