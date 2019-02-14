import React from 'react';
import { Card, CardText, CardBody,CardTitle, Button, Form, FormGroup, Label, Input} from 'reactstrap';

export default (props) => {
    const formShow = (!props.sendingMessage && !props.sentMessage && props.haveUserLocation)? (
        <Form onSubmit={props.handleSubmit}>
            <FormGroup>
                <Label for="name">Name</Label>
                <Input onChange={props.handleOnChange} type="text" name="name" id="name" placeholder="Enter your Name" />
            </FormGroup>
            <FormGroup>
                <Label for="message">Message</Label>
                <Input onChange={props.handleOnChange} type="textarea" name="message" id="message" placeholder="Enter your Message" />
            </FormGroup>
            <Button colour="info" disabled={props.formIsNotValid}>Send</Button>
        </Form>
    ): (props.sendingMessage || !props.haveUserLocation?
       <img className="loadin_img" src="loading.gif" alt="loading..." /> :
       <CardText>Thanks for submitting a message!</CardText>       
    );
    
    return (
        <Card className="message-form">
            <CardBody>
              <CardTitle>Welcome to GuestM.app!</CardTitle>
              <CardText>Live a message with your location!</CardText>
              {props.error?(<CardText className="warning">{props.error}</CardText>):''}
              {formShow}
            </CardBody>
        </Card>
    );
};
