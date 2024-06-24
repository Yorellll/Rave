import {useState} from "react";
import {Button, TextInput, View, Text, Alert, StyleSheet, Image, TouchableOpacity} from "react-native";


//La page d'accueil, qui permet de se connecter au serveur python
export default function LogScreen({navigation}) {
    const [port, setPort] = useState('');
    const [ipAdress, setIpAdress] = useState('')
    const [response, setResponse] = useState('');

    //Ici la fonction serverConnexion, celle-ci permet via un fetch de se connecter au serveur;
    //L'utilisateur lui transmet via les TextInput plus bas, l'ip ainsi que le port qui sont ensuite utilisés dans le lien de la requete
    const serverConnexion = async () => {
        //ici on encapsule le tout dans un try / catch pour les erreurs
        try {
            //Ici on fetch avec le lien de la requete, on peut voir l'ip ainsi que le port en paramètre
            const response = await fetch(`http://${ipAdress}:${port}/`)

            //On envoi une alert à l'utilisateur pour le notifier du bon fonctionnement de la connexion
            Alert.alert('Connection réussi !');

            //On mène tout de suite l'utilisateur vers la tab permettant le record de son
            navigation.navigate('Record', {ipAdress, port});
        } catch (err) {

            //Ici on envoi une alert si jamais la connexion échoue
            Alert.alert('Connection échoué !', 'Vérifié les informations et/ou le serveur.');

            //On log l'erreur
            console.error(err)
        }
    }

    return (
        <View style={style.container}>

            {/*Ici le logo Rave*/}
            <Image style={style.image} source={require('../assets/RaveLogo.png')}></Image>

            {/*Ici les input text pour l'ip et le port*/}
            <TextInput
                style={style.inputText}
                placeholder={"Adresse Ip"}
                onChangeText={setIpAdress}
            />

            <TextInput
                style={style.inputText}
                placeholder={"Port"}
                onChangeText={setPort}
            />

            {/*Ici le bouton qui permet l'appelle à la fonction de connexion*/}
            <TouchableOpacity style={style.connectButton} onPress={serverConnexion}>
                <Text style={style.connectButtonText}>Se connecter</Text>
            </TouchableOpacity>

        </View>

    )


}

//Ici le style
const style = StyleSheet.create({
    container: {
        alignItems: "center",
        justifyContent: "center",
    },

    inputText: {
        borderWidth: 1,
        borderRadius: 25,
        borderColor: 'black',
        width: '60%',
        height: 40,
        marginBottom: 20,
        textAlign: "center"
    },

    image: {
        marginTop: 50,
        marginBottom: 50,
    },

    connectButton: {
        backgroundColor: 'black',
        height: 40,
        borderRadius: 25,
        paddingLeft: 20,
        paddingRight: 20,
        paddingTop: 10,
        paddingBottom: 10
    },

    connectButtonText: {
        color: 'white',
    }
})