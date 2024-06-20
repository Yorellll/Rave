import {useState} from "react";
import {Button, TextInput, View, Text, Alert} from "react-native";


export default function LogScreen({navigation}){

    const [port, setPort] = useState('');
    const [ipAdress, setIpAdress] = useState('')
    const [response, setResponse] = useState('');
    const [connected, setConnected] = useState(false);

    const serverConnexion = async () => {
        try {
            const response = await fetch(`http://${ipAdress}:${port}/`)
            setConnected(true);
            Alert.alert('Connection Successful!', 'You are now connected to the server.'); // Display success message
            navigation.navigate('Record', {ipAdress, port});
        } catch (err){
            Alert.alert('Connection Zeub!', 'You are not connected to the server.' + ipAdress + " " + port); // Display success message
            setConnected(false);
            console.log(err);
        }
    }

    return (
        <View>

            <TextInput
                placeholder={"Ip Adress"}
                onChangeText={setIpAdress}
            />

            <TextInput
                placeholder={"Port"}
                onChangeText={setPort}
            />

            <Text>${response}</Text>

            <Button title={'Connect'}
                    onPress={serverConnexion}
            />

        </View>

    )


}