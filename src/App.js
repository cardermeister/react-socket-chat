import React, { Component } from 'react';
import './App.css';
import bridge from '@vkontakte/vk-bridge';
import '@vkontakte/vkui/dist/vkui.css';
import openSocket from 'socket.io-client';

bridge.send('VKWebAppInit');
bridge.send("VKWebAppGetUserInfo");

const socket = openSocket('https://ec2-13-53-135-89.eu-north-1.compute.amazonaws.com:4444/',{secure: true})

class UsrData extends Component {
  constructor(props)
  {
    super(props)
    this.state = {first_name: "u",last_name: "n", avatar_url: "", online: ""}
  }
  componentDidMount()
  {
    bridge.subscribe((e) => {
      if(e.detail.type === "VKWebAppGetUserInfoResult") {
         socket.emit('new_user', {name: (e.detail.data.first_name+' '+e.detail.data.last_name), avatar_url: e.detail.data.photo_100})
         socket.emit("get_online")
         this.setState({first_name: e.detail.data.first_name, last_name: e.detail.data.last_name, avatar_url: e.detail.data.photo_100})
    }});
    socket.on("get_online",data => {
      this.state.online = data
      this.setState(this.state)
    })
  }
  render()
  {
    return (
      <div>
        <img className="avatar" src={this.state.avatar_url}/>
        <div className="name"> {this.state.first_name} {this.state.last_name}</div>
        <div className="onlinetxt">Online: {this.state.online}</div>
      </div>
    )
  }
}

class MessageBox extends Component {
  constructor(props) {
    super(props);
    this.state = {"value":""}
    this.handleClick = this.handleClick.bind(this);
    this.handleChange = this.handleChange.bind(this);
    this.handleKeyDown = this.handleKeyDown.bind(this);
  }
  handleChange(event) {
    this.setState({value: event.target.value});
  }
  handleClick() {
    if(this.state.value=="")return
    socket.emit("message",this.state.value)
    this.setState({value: ""});
  }
  handleKeyDown = (event) => {
    if (event.key === 'Enter') {
      this.handleClick()
    }
  }
  render(){
    return (
      <div className="enter-message">
        <input type="text" placeholder="message.." autoFocus={true} value={this.state.value} onKeyDown={this.handleKeyDown} onChange={this.handleChange}/>
        <a href="#" class="send" onClick={this.handleClick}>Send</a>
      </div>
    );
  }
}

class TextElem extends Component {
  render(){
    return (
      <div className="message-element">
        <img className="avatar-16" src={this.props.avatar_url}/>
        {this.props.value}
      </div>
  )}
}

class ChatBody extends Component {
  constructor(props) {
    super(props);
    this.state = { text: [] }
  }
  componentDidMount()  {
    console.log(this)
    socket.on("new_user",data => {
      this.setState({
        text: this.state.text.concat({text: data.name+" присоединился к чату.", avatar_url: data.avatar_url}),
      })
      socket.emit("get_online")
    })
    socket.on("disconnect",data => {
      if(data.name==undefined)return
      this.setState({
        text: this.state.text.concat({text: data.name+" покинул чат.", avatar_url: data.avatar_url}),
      })
      socket.emit("get_online")
    })
    socket.on("message",data => {
      this.setState({
        text: this.state.text.concat({text: (data.name+": "+data.text).toString(), avatar_url: data.avatar_url}),
      })
    })
  }
  componentDidUpdate() {
    this.messagesEnd.scrollIntoView({ behavior: "smooth" });
  }
  render(){
    return (
      <div>
          {this.state.text.map(x => (<TextElem key={Math.random()} avatar_url={x.avatar_url} value={x.text}/>))}
          <div ref={(el) => { this.messagesEnd = el; }}>
          </div>
      </div>
    );
  }
}

class App extends Component {
  render() {
    return (
      <div className="chatbox">
        <div className="chatbox-header"><UsrData/></div>
        <div className="chatbox-body"><ChatBody/></div>
        <div className="chatbox-footer"><MessageBox/></div>
      </div>
    );
  }
}
document.body.style.overflow = "hidden"
document.body.classList.add("no-sroll")


export default App;
