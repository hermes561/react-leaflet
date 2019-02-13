import React, { Component } from 'react';
import { Map, TileLayer, Marker, Popup } from 'react-leaflet'
import 'leaflet/dist/leaflet.css'
import 'bootstrap/dist/css/bootstrap.css'
//import 'bootstrap/scss/_card.scss'
import Leaflet from 'leaflet'
import { Card, CardImg, CardText, CardBody,
  CardTitle, CardSubtitle, Button, Form, FormGroup, Label, Input, FormText } from 'reactstrap';
import Joi from 'joi';
import othersIconUrl from './chat_location_current.svg';
import currentIconUrl from './chat_location.svg';
import iconShadowUrl from './chat_location_shadow.svg';

const myIcon = Leaflet.icon({
    iconUrl: currentIconUrl,
    iconSize: [50, 82],
    iconAnchor: [0, 82],
    popupAnchor: [25, -65],
    shadowUrl: iconShadowUrl,
    shadowRetinaUrl: iconShadowUrl,
    shadowSize: [50, 82],
    shadowAnchor: [0, 93]
});

const othersIcons = Leaflet.icon({
    iconUrl: othersIconUrl,
    iconSize: [50, 82],
    iconAnchor: [0, 82],
    popupAnchor: [25, -65],
    shadowUrl: iconShadowUrl,
    shadowRetinaUrl: iconShadowUrl,
    shadowSize: [50, 82],
    shadowAnchor: [0, 93]
});

const schema = Joi.object().keys({
    name: Joi.string().regex(/^[a-zA-Z0-9À-ž -_]{1,100}$/).required(),
    message: Joi.string().min(1).max(500).required()
});

const API_URL = window.location.hostname === 'localhost'?'http://localhost:5000/api/v1/messages':'https://thawing-beyond-39791.herokuapp.com/api/v1/messages'

class App extends Component {
    state = {
        haveUserLocation: false,
        location: {
            lat: 44.439,
            lng: 26.096,
        },
        zoom: 2,
        userMeassage: {
            name:'',
            message:''   
        },
        sendingMessage: false,
        sentMessage: false,
        messages: [],
        error:null
    }
    
    mapRef = React.createRef()
    
    getMesages() {
        fetch(API_URL)
        .then(res => res.json())
        .then(messages=> {
            const haveSeenLocation = {};
            messages = messages.reduce((all, message) => {
                const key = `${message.latitude.toFixed(3)}${message.longitude.toFixed(3)}`;
                if(haveSeenLocation[key]) {
                    haveSeenLocation[key].otherMessages = haveSeenLocation[key].otherMessages || [];
                    haveSeenLocation[key].otherMessages.push(message);
                } else {
                    haveSeenLocation[key] = message;
                    all.push(message);
                }
                return all;
            },[])
            this.setState({
                messages
            })
        })
        .catch(error => this.setState({ error: 'Canot load data from server!'}));
    }
    
    componentDidMount(){
        this.getMesages();
            
        navigator.geolocation.getCurrentPosition((position)=> {
            console.log(position);
            if(position) {
                this.setState({
                    location: {
                        lat:position.coords.latitude,
                        lng:position.coords.longitude
                    },
                    zoom:15,
                    haveUserLocation: true
                })
            }
        },(error) =>{
            console.log("we don't have their location");
            fetch('https://ipapi.co/json')
                .then(res=>res.json())
                .then(location=>{
                   this.setState({
                    location: {
                        lat:location.latitude,
                        lng:location.longitude
                    },
                    zoom:15,
                    haveUserLocation: true
                })
                })
        });
        const map = this.mapRef.current
        if (map !== null) {
            setTimeout(function(){ 
                map.leafletElement.invalidateSize();
            }, 400);
        }  
    }
    
    formIsValid = () => {
        const userMeassage = {
            name:this.state.userMeassage.name,
            message:this.state.userMeassage.message,
        }
        const result = Joi.validate(userMeassage, schema);
        //console.log('validation error: '+result.error);
        return result.error===null && this.state.haveUserLocation
    }
    
    handleSubmit = (e) => {
        e.preventDefault();
//        console.log(this.state.userMeassage);
        
        if(this.formIsValid()) {
            this.setState({
                sendingMessage: true
            });
            fetch(API_URL,{
                method: 'POST',
                headers: {
                   'content-type':'application/json'   
                },
                body: JSON.stringify({
                    name:this.state.userMeassage.name,
                    message:this.state.userMeassage.message, 
                    latitude: this.state.location.lat,
                    longitude: this.state.location.lng
                })
            })
            .then(res => res.json())
            .then(message=> {
               // console.log(message);
                let thisInst = this;
                setTimeout(function(){ 
                    thisInst.setState({
                        sendingMessage: false,
                        sentMessage: true
                    });
                    thisInst.getMesages()
                },1000);
            })
            .catch(error => {
                let thisInst = this;
                setTimeout(function(){
                    thisInst.setState({ 
                        error: 'Canot add data to server!',
                        sendingMessage: false,
                        sentMessage: false
                   })  
                }, 1000)
                  
            });
        }
    }
    
    handleOnChange = (e) => {
        this.setState({
            userMeassage: {
                ... this.state.userMeassage,
                [e.target.name]: e.target.value
            } 
        })
               
    }
    
    render() {
        const location = this.state.location;
        const markedLocation = !this.state.sentMessage?(
            <Marker 
               position={[location.lat,location.lng]}
               icon ={myIcon}
            >
            </Marker> 
        ):'';

        const othersLocations = this.state.messages.length?(
            this.state.messages.map(message => {
                return(
                    <Marker key={message._id}
                       position={[message.latitude,message.longitude]}
                       icon ={othersIcons}
                    >
                      <Popup>
                        <p><em>{message.name}</em>: {message.message}</p>
                        {message.otherMessages?(
                           message.otherMessages.map((item, i) => {
                               return(
                                  <p key={'item'+i}><em>{item.name}</em>: {item.message}</p> 
                               )
                           }) 
                        ):''}
                      </Popup>
                    </Marker> 
                )
            })
        ):'';
        
        const formShow = (!this.state.sendingMessage && !this.state.sentMessage && this.state.haveUserLocation)? (
            <Form onSubmit={this.handleSubmit}>
                <FormGroup>
                    <Label for="name">Name</Label>
                    <Input onChange={this.handleOnChange} type="text" name="name" id="name" placeholder="Enter your Name" />
                </FormGroup>
                <FormGroup>
                    <Label for="message">Message</Label>
                    <Input onChange={this.handleOnChange} type="textarea" name="message" id="message" placeholder="Enter your Message" />
                </FormGroup>
                <Button colour="info" disabled={!this.formIsValid()}>Send</Button>
            </Form>
        ): (this.state.sendingMessage || !this.state.haveUserLocation?
           <img className="loadin_img" src="loading.gif" alt="loading..." /> :
           <CardText>Thanks for submitting a message!</CardText>       
        )
        
        return (
            <div className="map">    
                <Map center={[location.lat,location.lng]} zoom={this.state.zoom}  ref={this.mapRef} className="map">
                    <TileLayer
                      attribution='&amp;copy <a href="http://osm.org/copyright">OpenStreetMap</a> contributors'
                      url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                    />
                    {markedLocation}
                    {othersLocations}
                </Map>
                <Card className="message-form">
                    <CardBody>
                      <CardTitle>Welcome to GuestM.app!</CardTitle>
                      <CardText>Live a message with your location!</CardText>
                      {this.state.error?(<CardText className="warning">{this.state.error}</CardText>):''}
                      {formShow}
                    </CardBody>
                </Card>
            </div>
        );
    }
}

export default App;
