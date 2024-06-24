import * as React from 'react';
import {
    View,
    useWindowDimensions,
    TextInput,
    Alert,
    Text, ActivityIndicator, TouchableOpacity, ScrollView, StyleSheet
} from 'react-native';
import {TabBar, TabView} from 'react-native-tab-view';
import {Audio} from "expo-av";
import * as FileSystem from "expo-file-system";
import {useEffect, useState} from "react";
import {useRoute} from "@react-navigation/native";
import * as DocumentPicker from "expo-document-picker";
import {Picker} from "@react-native-picker/picker";
import ListAudio from "../components/ListAudio";
import {selectAudioStyle} from "../style/selectAudioStyle";
import {selectModelStyle} from "../style/selectModelStyle";
//La fonction changeTab transmis en paramètre à chaque fois sert a transmettre l'audio entre les tabs (la 1 et la 2 notamment)

//Fonction et code pour la slide 1, liste des audio enregistrer précédament
const AudioList = ({changeTab}) => {

    const [audioFiles, setAudioFiles] = useState([]);

    //Ici le useEffect qui permet de charger les audio enregistré dans le téléphone
    useEffect(() => {
        loadAudioFiles();
    }, []);

    //Ici la fonction qui permet de charger les audios
    const loadAudioFiles = async () => {
        //Ici on vient chercher les fichier audio
        const files = await FileSystem.readDirectoryAsync(FileSystem.documentDirectory);

        //Ici on filtre les fichiers pour ne prendre que les fichiers .m4a
        const audioFiles = files.filter(file => file.endsWith('.m4a'));
        setAudioFiles(audioFiles);
    };

    //Ici la fonction qui permet de charger un audio depuis le téléphone
    const selectAudioFromPhone = async () => {
        const result = await DocumentPicker.getDocumentAsync({type: 'audio/*'});
        if (result.type === 'success') {
            //Après la séléction du fichier dans le téléphone on se dirige vers la slide 2
            changeTab(1, result.uri)
        }
    };

    //Ici la fonction qui lance le fichier audio chargé depuis le téléphone
    const playAudioFromUri = async (uri) => {
        const {sound} = await Audio.Sound.createAsync({uri});
        setSound(sound);
        await sound.playAsync();
    };


    return (
        <View style={selectAudioStyle.container}>
            <Text style={selectAudioStyle.title}>Veuillez choisir un audio</Text>

            {/*Ici le composant fait pour charger la liste des audios*/}
            <ListAudio audioList={audioFiles} changeTab={changeTab}/>

            <TouchableOpacity style={selectAudioStyle.phoneButton} onPress={selectAudioFromPhone}>
                <Text>Charger un audio du téléphone</Text>
            </TouchableOpacity>
        </View>
    )

}

//Fonction et code pour la slide 2, choix du model de transformation de l'audio
const ModelChoice = ({audioFile}) => {
    const route = useRoute();
    const {ipAdress, port} = route.params;
    const [model, setModel] = useState("");
    const [transformedAudio, setTransformedAudio] = useState(null);
    const [sound, setSound] = useState(null);
    const [models, setModels] = useState([]);
    const [saveFileName, setSaveFileName] = useState("");
    const [loadIndicator, setLoadIndicator] = useState(false);

    const servAdress = "http://" + ipAdress + ":" + port;

    //Ici la fonction pour envoyé un fichier au serveur
    const sendFile = async (fileUri) => {
        //On encapsule l'ensemble dans un try catch
        try {
            //Ici on set le formData avec lequel on envoi le fichier
            const formData = new FormData();
            //On y ajoute les paramètres nécéssaire
            formData.append("file", {
                uri: fileUri,
                name: audioFile,
                type: "audio/wav",
            });

            //Ici on lance la requête au serveur avec la bonne route et en transmettant le form data
            const resp = await fetch(`${servAdress}/upload`, {
                method: "POST",
                body: formData,
                uploadType: FileSystem.FileSystemUploadType.MULTIPART,
                headers: {"Content-Type": "multipart/form-data", filename: fileUri}
            });
        } catch (error) {

            //Ici on log les erreurs s'il y en a
            console.error("L'envoi a échoué", error);
        }
    };


    //Ici la fonction pour téléchargé le fichier audio renvoyé par le serveur
    const downLoadFile = async () => {
        //On encapsule l'ensemble dans un try catch
        try {
            //Ici on set le dossier dans lequel on va enregistrer le fichier
            let directory = FileSystem.documentDirectory + "my_directory/";
            await FileSystem.makeDirectoryAsync(directory, {intermediates: true});

            //Ici on fait la requete au serveur pour téléchargé le fichier
            const {uri} = await FileSystem.downloadAsync(`${servAdress}/download`, directory + ".wav");
            return uri;

        } catch (error) {
            //Ici on log les erreurs s'il y en a
            console.error("Le téléchargement du fichier a échoué.", error);
        }
    };


    //Ici la fonction qui permet d'aller chercher les models, encapsulé dans un useEffect pour les chargés au chargement du screen
    useEffect(() => {
        const getModels = async () => {
            //On encapsule l'ensemble dans un try catch
            try {
                //Ici on fait la requete au serveur pour chargé la liste de model
                const response = await fetch(`${servAdress}/getmodels`);

                //On tranforme le résultat en json, on s'assure ensuite que c'est bien un tableau de modeles
                const result = await response.json();
                if (result && result.models && Array.isArray(result.models)) {
                    setModels(result.models);
                } else {
                    //Ici on log le résultat si jamais le format de réponse n'est pas correct
                    console.error("Les données reçues ne sont pas dans le format attendu:", result);
                }
            } catch (err) {
                //Ici on log les erreurs s'il y en a
                console.error("Erreur lors de la récupération des modèles:", err);
            }
        };
    }, []);


    //Ici la fonction pour séléctionner le modèle que le serveur utilisera
    const setChoosenModel = async (itemValue) => {
        //On encapsule l'ensemble dans un try catch
        try {
            //Ici la requête envers le serveur avec le model choisis en paramètre
            await fetch(`${servAdress}/selectModel/${itemValue}`)
        } catch (err) {
            Alert.alert('Erreur durant le changement.');
            //Ici on log les erreurs s'il y en a
            console.log(err);
        }
    };

    //Ici la fonction qui permet de jouer l'audio choisis
    const playAudio = async (uri) => {
        const {sound} = await Audio.Sound.createAsync({uri});
        setSound(sound);
        await sound.playAsync();
    };

    //Ici la fonction qui permet lancer la requête de tranformation de l'audio
    const transformAudio = async () => {
        //Si aucun audio n'est séléctionné, alors on le signal
        if (!audioFile) {
            Alert.alert('Erreur', 'Aucun fichier audio sélectionné.');
            return;
        }

        //Ici l'indicateur de chargement que l'on affiche
        setLoadIndicator(true)

        const fileUri = `${FileSystem.documentDirectory}${audioFile}`;

        //Ici on envoie le fichier
        await sendFile(fileUri);
        //On télécharge ensuite le résulat
        const transformedUri = await downLoadFile(fileUri);

        setTransformedAudio(transformedUri);

        //Une fois la réponse obtenue on retire l'indicateur de chargement
        setLoadIndicator(false)
    };

    //Ici la fonction pour sauvegardé l'audio nouvellement convertis.
    const saveConvertedAudio = async () => {
        //S'il y a un nom de fichier et un audio transformé, on le sauvegarde
        if (transformedAudio && saveFileName) {
            //Ici on set le dossier pour sauvegarder le fichier audio
            const directory = FileSystem.documentDirectory + "saved_converted_audio/";
            await FileSystem.makeDirectoryAsync(directory, {intermediates: true});
            const fileName = saveFileName + transformedAudio.split('/').pop();
            const newFileUri = `${directory}${fileName}`;

            //Ici on bouge le fichier dans le nouveau dossier
            await FileSystem.copyAsync({
                from: transformedAudio,
                to: newFileUri,
            });

            Alert.alert('Audio sauvegardé.');
        } else {
            Alert.alert('Erreur', "Aucun fichier audio converti disponible ou vous n'avez pas entrez de nom pour le fichier.");
        }
    };

    //Ici la fonction qui change, le model
    const valueChange = async (itemValue) => {
        setModel(itemValue);
        setChoosenModel(itemValue);
    }

    return (
        <ScrollView style={selectModelStyle.container}>

            <Text style={selectModelStyle.title}>Model</Text>

            <Picker
                style={selectModelStyle.picker}
                selectedValue={model}
                mode={"dialog"}
                onValueChange={(itemValue, itemIndex) => valueChange(itemValue)}
            >
                {/*J'ai fais le choix de mettre les modeles en dure, car j'ai eu beaucoup de soucis avec le set des modèles*/}
                <Picker.Item label="Cats" value="cats.onnx"/>
                <Picker.Item label="Darbouka" value="darbouka.onnx"/>
                <Picker.Item label="Dogs" value="dogs.onnx"/>
                <Picker.Item label="Jazz" value="jazz.onnx"/>
                <Picker.Item label="Speech" value="speech.onnx"/>

            </Picker>

            <Text style={selectModelStyle.title}>Audio d'origine</Text>

            {loadIndicator === true && (
                <View style={selectModelStyle.loadingContainer}>
                    <ActivityIndicator size="large"/>
                </View>
            )}

            {audioFile && (
                <View>
                    <Text style={selectModelStyle.text}>Audio d'entrée : {audioFile}</Text>
                    <TouchableOpacity style={selectModelStyle.button}
                                      onPress={() => playAudio(`${FileSystem.documentDirectory}${audioFile}`)}>
                        <Text style={selectModelStyle.buttonText}>Play</Text>
                    </TouchableOpacity>
                </View>
            )}

            <TouchableOpacity style={selectModelStyle.button} onPress={transformAudio}>
                <Text style={selectModelStyle.buttonText}>Transférer l'audio</Text>
            </TouchableOpacity>

            {transformedAudio && (
                <View>
                    <Text style={selectModelStyle.title}>Audio converti</Text>

                    <TouchableOpacity style={selectModelStyle.button} onPress={() => playAudio(transformedAudio)}>
                        <Text style={selectModelStyle.buttonText}>Play</Text>
                    </TouchableOpacity>

                    <TextInput
                        style={selectModelStyle.inputText}
                        placeholder="Nom du fichier"
                        value={saveFileName}
                        onChangeText={setSaveFileName}
                    />

                    <TouchableOpacity style={selectModelStyle.button} onPress={saveConvertedAudio}>
                        <Text style={selectModelStyle.buttonText}>Enregistrer l'audio converti</Text>
                    </TouchableOpacity>

                </View>
            )}
        </ScrollView>
    )
}

const ConvertedAudio = ({changeTab}) => {
    const [audioFiles, setAudioFiles] = useState([]);
    const [sound, setSound] = useState(null);

    //La fonction pour charger les fichier audio
    const loadAudioFiles = async () => {
        const directory = FileSystem.documentDirectory + "saved_converted_audio/";
        const files = await FileSystem.readDirectoryAsync(directory);
        setAudioFiles(files);
    };

    //Le useEffect pour charger les audio au chargement du screen
    useEffect(() => {
        loadAudioFiles();
    }, []);

    return (
        <View style={{flex: 1, padding: 16}}>
            <ListAudio audioList={audioFiles} changeTab={changeTab}/>
        </View>
    );
}

export default function ManageTabScreen() {
    const layout = useWindowDimensions();
    const [index, setIndex] = React.useState(0);

    //Ici les routes pour l'ensemble de la tabView
    const [routes] = React.useState([
        {key: 'first', title: 'Liste'},
        {key: 'second', title: 'Transfère'},
        {key: 'third', title: 'Resultat'},
    ]);

    const [selectedAudio, setSelectedAudio] = useState(null);

    //La fonction changeTab qui permet la transmmission du fichier audio entre les tabs, ainsi que la navigation
    const changeTab = (newIndex, audioFile = null) => {
        setSelectedAudio(audioFile);
        setIndex(newIndex);
    };

    const renderTabBar = props => (
        <TabBar
            {...props}
            indicatorStyle={{ backgroundColor: 'white' }}
            style={styles.tabBar}
            labelStyle={styles.label}
        />
    );

    //Ici le style de la tabBar
    const styles = StyleSheet.create({
        tabBar: {
            backgroundColor: 'black',
        },
        label: {
            color: 'white',
        },
    });

    return (
        //Ici la tabview qui gère l'ensemble des slides
        <TabView
            //Ici on indique la route et l'index de la tab
            navigationState={{index, routes}}

            //Ici le fonction qui rend les vues de chaques slide en fonction de la route
            renderScene={({route}) => {
                switch (route.key) {
                    case 'first':
                        return <AudioList changeTab={changeTab}/>;
                    case 'second':
                        return <ModelChoice audioFile={selectedAudio} changeTab={changeTab}/>;
                    case 'third':
                        return <ConvertedAudio/>;
                    default:
                        return null;
                }
            }}
            //Ici on change l'index quand l'utilisateur change de tab
            onIndexChange={setIndex}
            //Ici on définit la taille de la tabBar
            initialLayout={{width: layout.width}}
            //Ici on appelle la tabBar du dessus afin de lui attribuer le style voulu
            renderTabBar={renderTabBar}
        />

    );



}