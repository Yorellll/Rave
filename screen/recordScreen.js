import React, {useState, useEffect} from 'react';
import {View, Button, TextInput, StyleSheet, Alert, Platform, TouchableOpacity, Text} from 'react-native';
import {Audio} from 'expo-av';
import * as FileSystem from 'expo-file-system';
import * as Permissions from 'expo-permissions';
import {useRoute} from "@react-navigation/native";
import Icon from "react-native-vector-icons/MaterialCommunityIcons";

//Ici le screen qui permet de le record d'audio
export default function RecordScreen({navigation}) {
    const route = useRoute();
    const {ipAdress, port} = route.params;
    const [recording, setRecording] = useState(null);
    const [sound, setSound] = useState(null);
    const [fileName, setFileName] = useState('');
    const [recordingUri, setRecordingUri] = useState('');
    const [playbackPosition, setPlaybackPosition] = useState(0);
    const [playing, setPlaying] = useState(false)
    const [playingTitle, setPlayingTitle] = useState("Pause")

    //Ici le UseEffect qui permet d'assurer la nullité du son au chargement du screen
    useEffect(() => {
        return sound
            ? () => {
                sound.unloadAsync();
            }
            : undefined;
    }, [sound]);

    //Ici la fonction qui permet de démarrer le record d'audios
    const startRecording = async () => {

        //On encapsule l'ensemble dans un try catch
        try {

            //Ici on demande la permission pour record des audios
            const permission = await Audio.requestPermissionsAsync();

            //Ici on active ce qu'il faut pour les appareils IOS
            if (permission.status === 'granted') {
                await Audio.setAudioModeAsync({
                    allowsRecordingIOS: true,
                    playsInSilentModeIOS: true,
                });

                //Ici on démarre le record et on met sa qualité en basse qualité
                const {recording} = await Audio.Recording.createAsync(
                    Audio.RECORDING_OPTIONS_PRESET_LOW_QUALITY
                );
                //Ici on transmet l'objet qui vient d'être record
                setRecording(recording);
            } else {
                //Si la permission n'a pas été donnée on indique qu'elle est nécéssaire
                Alert.alert('Permission requise');
            }
        } catch (err) {
            //Ici on log l'erreur s'il y en a une
            console.error("L'enregisrement a échoué.", err);
        }
    };

    //Ici la fonction qui permet d'arrêter le record
    const stopRecording = async () => {
        //Ici on remet le record sur undefined pour le prochain enregistrement
        setRecording(undefined);
        //Ici on stop le record
        await recording.stopAndUnloadAsync();
        //Ici on garde le chemin du fichier créé
        const uri = recording.getURI();
        setRecordingUri(uri);
    };

    //Ici la fonction qui permet d'écouter l'audio nouvellement fait
    const playSound = async () => {
        if (recordingUri) {
            //Ici si on vient d'enregistrer un audio, on ve le chercher grâce au chemin gardé précédemment
            const {sound} = await Audio.Sound.createAsync({uri: recordingUri});
            setSound(sound);
            //Ici on lance l'audio
            await sound.playAsync();
        }
    };

    //Ici la fonction qui permet de mettre en pause l'audio qu'on écoute
    const pauseSound = async () => {
        if (sound) {
            setPlaying(true);
            //On vient chercher le status de la lecture en cours
            const status = await sound.getStatusAsync();
            //On garde sa position en mémoire
            setPlaybackPosition(status.positionMillis);
            //On met la lecture en pause
            await sound.pauseAsync();
        }
    };

    //Ici la fonction qui permet de relancer l'audio mis en pause
    const resumeSound = async () => {
        //Ici si un audio a été mis en pause on le relance
        if (sound && playbackPosition !== undefined) {
            setPlaying(false);
            //Ici on rejoue l'audio depuis la position gardé en mémoire avant
            await sound.playFromPositionAsync(playbackPosition);
        }
    };

    //Ici la fonction qui permet de save un audio
    const saveAudio = async () => {
        //Si l'utilisateur a record et qu'il a rentré un nom pour le fichier on l'enregistre
        if (recordingUri && fileName) {

            //Ici on définis le répertoire d'enregistrement
            const externalDir = FileSystem.externalStorageDirectory || FileSystem.documentDirectory;

            //Ici le on définit l'uri complet d'enregistrement
            const newUri = `${externalDir}${fileName}.m4a`;

            //Ici on déplace le fichier de l'endroit où on l'enregitre au début, a sont enregistrement final
            await FileSystem.moveAsync({
                from: recordingUri,
                to: newUri,
            });
            setRecordingUri(newUri);

            //Ici on notifie l'utilisateur que l'audio est bien enregistré
            Alert.alert('Audio enregistré');
        } else {

            //Ici on alerte l'utilisateur qu'il faut rentré un nom pour le fichier
            Alert.alert('Erreur', "Veuillez entré le nom du fichier.");
        }
    };

    //Ici
    const deleteAudio = async () => {
        if (recordingUri) {
            await FileSystem.deleteAsync(recordingUri);
            setRecordingUri('');
            setFileName('');
            Alert.alert('Audio supprimé');
        }
    };

    //Ici la fonction qui demande la permission sur les téléphones android
    const getPermissions = async () => {
        if (Platform.OS === 'android') {
            const {status} = await Permissions.askAsync(Permissions.MEDIA_LIBRARY);
            if (status !== 'granted') {
                Alert.alert('Permission de stockage requise.' );
            }
        }
    };

    //Ici la fonction qui permet de reprendre l'écoute de l'audio
    const pauseResume = async () => {
        if (playing && playingTitle === "Reprendre") {
            setPlayingTitle("Pause")
            resumeSound();
        } else if (!playing && playingTitle === "Pause") {
            setPlayingTitle("Reprendre")
            pauseSound();
        }
    }

    //Ici la fonction pour passer au prochain screen
    const goNext = async () => {
        navigation.navigate('Manage Audio', {ipAdress, port});
    }

    //Ici le use effect qui permet de demandé les autorisations à l'affichage du screen
    useEffect(() => {
        getPermissions();
    }, []);

    return (
        <View style={styles.container}>

            <View style={styles.recordContainer}>
                <TouchableOpacity onPress={recording ? stopRecording : startRecording}>
                    <Icon name={'play'} size={120} color={recording ? 'red' : 'black'}></Icon>
                </TouchableOpacity>

                <TouchableOpacity onPress={recording ? stopRecording : startRecording}>
                    <Icon name={'stop'} size={120}></Icon>
                </TouchableOpacity>
            </View>

            <View style={styles.midButtonContainer}>
                <TouchableOpacity style={styles.button} onPress={playSound}>
                    <Text style={styles.buttonText}>Play</Text>
                </TouchableOpacity>

                <TouchableOpacity style={styles.button} onPress={pauseResume}>
                    <Text style={styles.buttonText}>{playingTitle}</Text>
                </TouchableOpacity>

                <TouchableOpacity style={styles.button} onPress={deleteAudio}>
                    <Text style={styles.buttonText}>Delete</Text>
                </TouchableOpacity>
            </View>

            <TextInput
                placeholder="Nom du fichier"
                value={fileName}
                onChangeText={setFileName}
                style={styles.input}
            />

            <View style={styles.saveFileContainer}>

            <TouchableOpacity style={styles.footerButtons} onPress={saveAudio}>
                <Text>Save audio</Text>
            </TouchableOpacity>

            </View>

            <TouchableOpacity style={styles.footerButtons} onPress={goNext}>
                <Text>Gestion des audios</Text>
            </TouchableOpacity>

        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        padding: 16,
    },

    input: {
        height: 40,
        borderColor: 'gray',
        borderWidth: 1,
        marginBottom: 12,
        paddingHorizontal: 8,
        borderRadius:25,
        textAlign:"auto",
        backgroundColor:'white',
    },

    recordContainer: {
        alignItems: "center",
        justifyContent: "center",
        flexDirection: "row"
    },

    midButtonContainer: {
        flex: 1,
        flexDirection: "row",
        justifyContent: "space-between",
        marginTop: 20
    },

    button:{
        backgroundColor: 'black',
        height: 40,
        borderRadius: 25,
        paddingLeft: 20,
        paddingRight: 20,
        paddingTop: 10,
        paddingBottom: 10
    },

    buttonText:{
        color:'white',
    },

    saveFileContainer:{
        justifyContent:"space-between",
        marginBottom:75,
        width:"100%"
    },

    footerButtons:{
        alignItems:"center",
        borderRadius:25,
        borderWidth:1,
        borderColor: 'black',
        padding:10,
        marginBottom:25,
    },


});
