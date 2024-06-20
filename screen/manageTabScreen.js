import * as React from 'react';
import {
    View,
    useWindowDimensions,
    Button,
    TextInput,
    Alert,
    Platform,
    Text,
    FlatList,
    TouchableOpacity, StyleSheet, ActivityIndicator
} from 'react-native';
import {TabView, SceneMap} from 'react-native-tab-view';
import {Audio} from "expo-av";
import * as FileSystem from "expo-file-system";
import * as Permissions from "expo-permissions";
import {useEffect, useState} from "react";
import {useNavigation, useRoute} from "@react-navigation/native";
import * as DocumentPicker from "expo-document-picker";
import {Picker} from "@react-native-picker/picker";


//Fonction et code pour la slide 1, liste des audio enregistrer précédament
const AudioList = ({changeTab}) => {

const [audioFiles, setAudioFiles] = useState([]);
const [playingAudio, setPlayingAudio] = useState(null);
const [sound, setSound] = useState(null);
const navigation = useNavigation();

useEffect(() => {
    loadAudioFiles();
}, []);

const loadAudioFiles = async () => {
    const files = await FileSystem.readDirectoryAsync(FileSystem.documentDirectory);
    const audioFiles = files.filter(file => file.endsWith('.m4a'));
    setAudioFiles(audioFiles);
};

const playAudio = async (fileName) => {
    const fileUri = `${FileSystem.documentDirectory}${fileName}`;
    const {sound} = await Audio.Sound.createAsync({uri: fileUri});
    setSound(sound);
    await sound.playAsync();
};

const stopAudio = async () => {
    if (sound) {
        await sound.stopAsync();
        await sound.unloadAsync();
        setSound(null);
    }
};

const deleteAudio = async (fileName) => {
    const fileUri = `${FileSystem.documentDirectory}${fileName}`;
    await FileSystem.deleteAsync(fileUri);
    loadAudioFiles();
    Alert.alert('Audio Deleted', 'The recording has been deleted.');
};

const selectAudioFromPhone = async () => {
    const result = await DocumentPicker.getDocumentAsync({type: 'audio/*'});
    if (result.type === 'success') {
        playAudioFromUri(result.uri);
    }
};

const playAudioFromUri = async (uri) => {
    const {sound} = await Audio.Sound.createAsync({uri});
    setSound(sound);
    await sound.playAsync();
};

const selectedAudio = (file) => {
changeTab(1, file)
};

    const styles = StyleSheet.create({
        container: {
            flex: 1,
            padding: 16,
        },
        title: {
            fontSize: 24,
            fontWeight: 'bold',
            marginBottom: 16,
        },
        audioItem: {
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: 8,
        },
        audioText: {
            fontSize: 16,
        },
    });


return (
    <View style={styles.container}>
        <Text style={styles.title}>Sélection de l'audio</Text>
        <FlatList
            data={audioFiles}
            keyExtractor={(item) => item}
            renderItem={({item}) => (
                <View style={styles.audioItem}>
                    <TouchableOpacity onPress={() => selectedAudio(item)}>
                        <Text style={styles.audioText}>{item}</Text>
                    </TouchableOpacity>
                    <Button title="Play" onPress={() => playAudio(item)}/>
                    <Button title="Delete" onPress={() => deleteAudio(item)}/>
                </View>
            )}
        />
        <Button title="Sélectionner audio du téléphone" onPress={selectAudioFromPhone}/>
    </View>
)



}

//Fonction et code pour la slide 2, choix du model de tranformation de l'audio

const ModelChoice = ({audioFile, changeTab}) => {
    const route = useRoute();
    const {ipAdress, port} = route.params;
    const [model, setModel] = useState("");
    const [transformedAudio, setTransformedAudio] = useState(null);
    const [sound, setSound] = useState(null);
    const [models, setModels] = useState([]);
    const [saveFileName, setSaveFileName] = useState("");
    const [loadIndicator, setLoadIndicator] = useState(false);

    const servAdress = "http://" + ipAdress + ":" + port;

    const sendFile = async (fileUri) => {
    try{
        const formData = new FormData();
        formData.append("file", {
            uri: fileUri,
            name: audioFile,
            type: "audio/wav", // Vous pouvez ajuster ce type selon le type de fichier que vous envoyez
        });

        console.log(fileUri + "FILE URI")
        const resp = await fetch(`${servAdress}/upload`, {
            method: "POST",
            body: formData,
            uploadType: FileSystem.FileSystemUploadType.MULTIPART,
            headers: { "Content-Type": "multipart/form-data" ,filename: fileUri}
        });
        console.log(resp.body);
    } catch (error) {
        console.error("Failed to upload file: ", error);
    }

        // try {
        //     console.log(fileUri + "FILE URI")
        //     const resp = fetch(`${servAdress}/upload`, fileUri, {
        //         fieldName: 'file',
        //         httpMethod: 'POST',
        //         uploadType: FileSystem.FileSystemUploadType.MULTIPART,
        //         headers: { filename: fileUri }
        //     });
        //     console.log(resp.body);
        // } catch (error) {
        //     console.error("Failed to upload file: ", error);
        // }
    };


    const downLoadFile = async () => {
        // let directory = FileSystem.documentDirectory + "my_directory"
        // await FileSystem.makeDirectoryAsync(directory);
        //
        // const {uri} = await FileSystem.downloadAsync(servAdress + "/download", directory + "/hey.wav")
        try {
            let directory = FileSystem.documentDirectory + "my_directory/";
            await FileSystem.makeDirectoryAsync(directory, { intermediates: true });

            const { uri } = await FileSystem.downloadAsync(`${servAdress}/download`, directory + "hey.wav");
            return uri;
        } catch (error) {
            console.error("Failed to download file: ", error);
        }
    };


    useEffect(() => {
        const getModels = async () => {
            try {
                const response = await fetch(`${servAdress}/getmodels`);
                const result = await response.json();
                if (result && result.models && Array.isArray(result.models)) {
                    setModels(result.models); // Met à jour l'état avec le tableau de modèles
                } else {
                    console.error("Les données reçues ne sont pas dans le format attendu:", result);
                }
            } catch (err) {
                console.error("Erreur lors de la récupération des modèles:", err);
            }
        };

        getModels();
    }, []); // Appeler une seule fois après le montage initial


    const setChoosenModel = async (itemValue) => {
        try {
            await fetch(`${servAdress}/selectModel/${itemValue}`)
            Alert.alert('Model greatly changed!', 'Model set.'); // Display success message
        } catch (err){
            Alert.alert('Error', 'Please try again.');
            console.log(err);
        }
    };

    const playAudio = async (uri) => {
        const { sound } = await Audio.Sound.createAsync({ uri });
        setSound(sound);
        await sound.playAsync();
    };

    const transformAudio = async () => {
        if (!audioFile) {
            Alert.alert('Erreur', 'Aucun fichier audio sélectionné.');
            return;
        }

        setLoadIndicator(true)
        const fileUri = `${FileSystem.documentDirectory}${audioFile}`;
        console.log(audioFile + " audio zeub " + FileSystem.documentDirectory)
        await sendFile(fileUri);
        const transformedUri = await downLoadFile(fileUri);
        setTransformedAudio(transformedUri);
        setLoadIndicator(false)
    };

    const saveConvertedAudio = async () => {
        if (transformedAudio && saveFileName) {
            const directory = FileSystem.documentDirectory + "saved_converted_audio/";
            await FileSystem.makeDirectoryAsync(directory, { intermediates: true });
            const fileName = saveFileName + transformedAudio.split('/').pop();
            const newFileUri = `${directory}${fileName}`;

            await FileSystem.copyAsync({
                from: transformedAudio,
                to: newFileUri,
            });

            Alert.alert('Audio Saved', 'The converted audio has been saved.');
        } else {
            Alert.alert('Erreur', "Aucun fichier audio converti disponible ou vous n'avez pas entrez de nom pour le fichier.");
        }
    };

    const valueChange = async (itemValue) => {
        setModel(itemValue);
        setChoosenModel(itemValue);
    }

    // useEffect(() => {
    //     getModels();
    // }, []);


return(
    <View style={{ flex: 1, backgroundColor: '#673ab7', padding: 16 }}>
        <Picker
            selectedValue={model}
            mode={"dialog"}
            onValueChange={(itemValue, itemIndex) => valueChange(itemValue)}
        >
            <Picker.Item label="Cats" value="cats.onnx" />
            <Picker.Item label="Darbouka" value="darbouka.onnx" />
            <Picker.Item label="Dogs" value="dogs.onnx" />
            <Picker.Item label="Jazz" value="jazz.onnx" />
            <Picker.Item label="Speech" value="speech.onnx" />
        </Picker>

        {/*<Picker*/}
        {/*    selectedValue={models.length > 0 ? models[0] : null} // Par défaut, sélectionne le premier modèle, ajustez selon vos besoins*/}
        {/*    mode={"dialog"}*/}
        {/*    onValueChange={(itemValue) => valueChange(itemValue)}*/}
        {/*>*/}
        {/*    /!* Mapper les modèles dans les Picker.Item *!/*/}
        {/*    {models.map((model, index) => (*/}
        {/*        <Picker.Item key={index} label={model} value={model} />*/}
        {/*    ))}*/}
        {/*</Picker>*/}

        <Button title="Transférer l'audio" onPress={transformAudio} />
        {loadIndicator === true && (
            <ActivityIndicator size="large" />
        )}
        {audioFile && (
            <View>
                <Text>audio d'entrée: {audioFile}</Text>
                <Button title="Play" onPress={() => playAudio(`${FileSystem.documentDirectory}${audioFile}`)} />
            </View>
        )}
        {transformedAudio && (
            <View>
                <Text>audio converti</Text>
                <Button title="Play" onPress={() => playAudio(transformedAudio)} />
                <TextInput
                    placeholder="Enter file name"
                    value={saveFileName}
                    onChangeText={setSaveFileName}
                />
                <Button title="Enregistrer l'audio converti" onPress={saveConvertedAudio} />
            </View>
        )}
    </View>
    )
}

const ConvertedAudio = () => {
    const [audioFiles, setAudioFiles] = useState([]);
    const [sound, setSound] = useState(null);

    const loadAudioFiles = async () => {
        const directory = FileSystem.documentDirectory + "saved_converted_audio/";
        const files = await FileSystem.readDirectoryAsync(directory);
        setAudioFiles(files);
    };

    const playAudio = async (fileName) => {
        const fileUri = `${FileSystem.documentDirectory}saved_converted_audio/${fileName}`;
        const { sound } = await Audio.Sound.createAsync({ uri: fileUri });
        setSound(sound);
        await sound.playAsync();
    };

    const deleteAudio = async (fileName) => {
        const fileUri = `${FileSystem.documentDirectory}saved_converted_audio/${fileName}`;
        await FileSystem.deleteAsync(fileUri);
        loadAudioFiles();
        Alert.alert('Audio Deleted', 'The recording has been deleted.');
    };

    useEffect(() => {
        loadAudioFiles();
    }, []);

    return (
        <View style={{ flex: 1, backgroundColor: '#34de04', padding: 16 }}>
            <Button title="Refresh" onPress={() => loadAudioFiles()} />
            <FlatList
                data={audioFiles}
                keyExtractor={(item) => item}
                renderItem={({ item }) => (
                    <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 10 }}>
                        <Text style={{ flex: 1 }}>{item}</Text>
                        <Button title="Play" onPress={() => playAudio(item)} />
                        <Button title="Delete" onPress={() => deleteAudio(item)} />
                    </View>
                )}
            />
        </View>
    );
}

const styles = {
    container: { flex: 1, padding: 16 },
    title: { fontSize: 24, fontWeight: 'bold' },
    audioItem: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 8 },
    audioText: { fontSize: 18 },
};

// const renderScene = SceneMap({
//     first: AudioList,
//     second: ModelChoice,
//     third: ConvertedAudio,
// })

const renderScene = ({ route, jumpTo }) => {
    switch (route.key) {
        case 'first':
            return <AudioList changeTab={jumpTo} />;
        case 'second':
            return <ModelChoice changeTab={jumpTo} />;
        case 'third':
            return <ConvertedAudio />;
    }
};

export default function ManageTabScreen() {
    const layout = useWindowDimensions();
    const [index, setIndex] = React.useState(0);

    const [routes] = React.useState([
        {key: 'first', title: 'First'},
        {key: 'second', title: 'Second'},
        {key: 'third', title: 'Third'},
    ]);

    const [selectedAudio, setSelectedAudio] = useState(null);
    const changeTab = (newIndex, audioFile = null) => {
        setSelectedAudio(audioFile);
        setIndex(newIndex);
    };
    return (
        // <TabView onIndexChange={setIndex} navigationState={{index, routes}} renderScene={renderScene}
        //          initialLayout={{width: layout.width}}/>
        <TabView
            navigationState={{ index, routes }}
            renderScene={({ route }) => {
                switch (route.key) {
                    case 'first':
                        return <AudioList changeTab={changeTab} />;
                    case 'second':
                        return <ModelChoice audioFile={selectedAudio} changeTab={changeTab} />;
                    case 'third':
                        return <ConvertedAudio />;
                    default:
                        return null;
                }
            }}
            onIndexChange={setIndex}
            initialLayout={{ width: layout.width }}
        />

    )

}