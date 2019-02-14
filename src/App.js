import React, { Component } from 'react';
import { Map, TileLayer, Marker, Popup } from 'react-leaflet'
import 'leaflet/dist/leaflet.css'
import 'bootstrap/dist/css/bootstrap.css'
//import 'bootstrap/scss/_card.scss'
import Leaflet from 'leaflet'
import Joi from 'joi';
import othersIconUrl from './chat_location_current.svg';
import currentIconUrl from './chat_location.svg';
import iconShadowUrl from './chat_location_shadow.svg';
import {getMesages, getLocation, sendMessage} from './API';
import MessageCard from './MessageCard';


const myIcon = Leaflet.icon({
    iconUrl: currentIconUrl,
    iconSize: [50, 82],
    iconAnchor: [9, 57],
    popupAnchor: [25, -65],
    shadowUrl: iconShadowUrl,
    shadowRetinaUrl: iconShadowUrl,
    shadowSize: [50, 82],
    shadowAnchor: [9, 57]
});

const othersIcons = Leaflet.icon({
    iconUrl: othersIconUrl,
    iconSize: [50, 82],
    iconAnchor: [9, 57],
    popupAnchor: [25, -65],
    shadowUrl: iconShadowUrl,
    shadowRetinaUrl: iconShadowUrl,
    shadowSize: [50, 82],
    shadowAnchor: [9, 57]
});

const schema = Joi.object().keys({
    name: Joi.string().regex(/^[a-zA-Z0-9À-ž -_]{1,100}$/).required(),
    message: Joi.string().min(1).max(500).required()
});


class App extends Component {
    state = {
        haveUserLocation: false,
        location: {
            lat: 44.439,
            lng: 26.096,
        },
        zoom: 3,
        userMeassage: {
            name:'',
            message:''   
        },
        sendingMessage: false,
        sentMessage: false,
        messages: [],
        error:null
    }
    
    mapRef = React.createRef();
    
    
    componentDidMount(){
        getMesages()
        .then(messages=> {
            this.setState({
                messages
            })
        })
        .catch(error => this.setState({ error: 'Canot load data from server!'}));
        
        getLocation()
        .then(location => {
            this.setState({
                location,
                zoom:15,
                haveUserLocation: true
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
            
            const messageToSend = {
                name:this.state.userMeassage.name,
                message:this.state.userMeassage.message, 
                latitude: this.state.location.lat,
                longitude: this.state.location.lng
            }
            let thisInst = this;
            
            sendMessage(messageToSend)
            .then(result=> {
                setTimeout(function(){ 
                    thisInst.setState({
                        sendingMessage: false,
                        sentMessage: true
                    });
                    getMesages()
                    .then(messages=> {
                        thisInst.setState({
                            messages
                        })
                    })
                    .catch(error => {
                        thisInst.setState({ error: 'Canot load data from server!'});
                    });
                },1000);
            })
            .catch(error => {
                setTimeout(function(){
                    thisInst.setState({ 
                        error: 'Canot add data to server!',
                        sendingMessage: false,
                        sentMessage: false
                   })
               },1000);
            })
            ;
        }
    }
    
    handleOnChange = (e) => {
        this.setState({
            userMeassage: {
                ...this.state.userMeassage,
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

        return (
            <div className="map">    
                <Map center={[location.lat,location.lng]} zoom={this.state.zoom}  ref={this.mapRef} className="map">
                    <TileLayer
                      attribution='&amp;copy <a href="http://osm.org/copyright">OpenStreetMap</a> Chat location by Iconika from the Noun Project'
                      url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                    />
                    {markedLocation}
                    {othersLocations}
                </Map>
                <MessageCard 
                    sendingMessage={this.state.sendingMessage} 
                    sentMessage={this.state.sentMessage} 
                    haveUserLocation={this.state.haveUserLocation}
                    error={this.state.error} 
                    handleSubmit ={this.handleSubmit}
                    handleOnChange ={this.handleOnChange}
                    formIsNotValid ={!this.formIsValid()}        
                />
            </div>
        );
    }
}

export default App;
