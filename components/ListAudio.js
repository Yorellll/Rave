import {Alert, FlatList, Text, TouchableOpacity, View, StyleSheet} from "react-native";
import * as FileSystem from "expo-file-system";
import {Audio} from "expo-av";
import {useEffect, useState} from "react";
import Icon from "react-native-vector-icons/MaterialCommunityIcons";


export default function ListAudio(props) {
    const tabChange = props.changeTab;
    const [audioFiles, setAudioFiles] = useState([]);
    const [sound, setSound] = useState(null);


    //Le useEffect pour charger les fichiers au chargement du composant
    useEffect(() => {
        loadAudioFiles();
    }, []);


    //La fonction pour charger les fichiers
    const loadAudioFiles = async () => {
        if (tabChange) {
            //On vient chercher les fichiers dans le répertoire de l'app
            const files = await FileSystem.readDirectoryAsync(FileSystem.documentDirectory);

            //On filtre sur les fichier .m4a
            const audioFiles = files.filter(file => file.endsWith('.m4a'));
            setAudioFiles(audioFiles);

        } else {
            //Sinon on charge les fichier du dossier spécifié
            const directory = FileSystem.documentDirectory + "saved_converted_audio/";
            const files = await FileSystem.readDirectoryAsync(directory);
            setAudioFiles(files);
        }

    };

    //La fonction qui joue l'audio
    const playAudio = async (fileName) => {
        if (tabChange) {
            //Ce code permet de jouer l'audio si on vient de la tab qui permet de séléctionner un audio
            const fileUri = `${FileSystem.documentDirectory}${fileName}`;
            const {sound} = await Audio.Sound.createAsync({uri: fileUri});
            await sound.playAsync();
        } else {
            //Ce code permet de jouer l'audio sur la tab des audios converti
            const fileUri = `${FileSystem.documentDirectory}saved_converted_audio/${fileName}`;
            const {sound} = await Audio.Sound.createAsync({uri: fileUri});
            setSound(sound);
            await sound.playAsync();
        }

    };

    //La fonction qui permet de supprimer un audio
    const deleteAudio = async (fileName) => {
        if (tabChange) {
            //On supprime l'audio si jamais on vient de la tab de séléction
            const fileUri = `${FileSystem.documentDirectory}${fileName}`;
            await FileSystem.deleteAsync(fileUri);
            await loadAudioFiles();
            Alert.alert('Audio supprimé');
        } else {
            //On supprime l'audio si c'est un audio de la tab des audios converti
            const fileUri = `${FileSystem.documentDirectory}saved_converted_audio/${fileName}`;
            await FileSystem.deleteAsync(fileUri);
            await loadAudioFiles();
            Alert.alert('Audio supprimé');
        }
    };

    //La fonction qui permet de séléctionner un audio
    const selectedAudio = (file) => {
        tabChange(1, file)
    };


    return (
        <View style={style.container}>
            {!tabChange && <TouchableOpacity style={style.refresh}>
                <Text style={style.text}>Refresh</Text>
            </TouchableOpacity>}

            <FlatList
                data={audioFiles}
                keyExtractor={(item) => item}
                renderItem={({item}) => (
                    <View style={style.itemContainer}>
                        {tabChange ? (
                            <TouchableOpacity onPress={() => selectedAudio(item)}>
                                <Text style={style.item}>{item}</Text>
                            </TouchableOpacity>
                        ) : (
                            <Text>{item}</Text>
                        )}

                        <TouchableOpacity onPress={() => playAudio(item)}>
                            <Icon size={24} name={'play'} color={'black'}></Icon>
                        </TouchableOpacity>

                        <TouchableOpacity onPress={() => deleteAudio(item)}>
                            <Icon size={24} name={'delete-outline'} color={'black'}></Icon>
                        </TouchableOpacity>

                    </View>
                )}
            />
        </View>
    )
}

const style = StyleSheet.create({
    container: {},

    itemContainer: {
        flexDirection: "row",
        justifyContent: "space-between",
        marginBottom: 20
    },

    item: {
        fontSize: 20,
        marginBottom: 20
    },

    refresh: {
        backgroundColor: 'black',
        height: 40,
        borderRadius: 25,
        paddingLeft: 20,
        paddingRight: 20,
        paddingTop: 10,
        paddingBottom: 10,
        alignItems: "center",
        marginTop: 5,
        marginBottom: 25
    },

    text: {
        color: 'white'
    }
})