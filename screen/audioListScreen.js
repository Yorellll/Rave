import React, { useState, useEffect } from 'react';
import { View, Text, Button, FlatList, StyleSheet, Alert, TouchableOpacity } from 'react-native';
import { Audio } from 'expo-av';
import * as FileSystem from 'expo-file-system';
import * as DocumentPicker from 'expo-document-picker';
import { useNavigation } from '@react-navigation/native';

export default function AudioListScreen() {
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
        const { sound } = await Audio.Sound.createAsync({ uri: fileUri });
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
        const result = await DocumentPicker.getDocumentAsync({ type: 'audio/*' });
        if (result.type === 'success') {
            playAudioFromUri(result.uri);
        }
    };

    const playAudioFromUri = async (uri) => {
        const { sound } = await Audio.Sound.createAsync({ uri });
        setSound(sound);
        await sound.playAsync();
    };

    const navigateToNextTab = (fileName) => {
        navigation.navigate('NextTab', { audioFile: fileName });
    };

    return (
        <View style={styles.container}>
            <Text style={styles.title}>Sélection de l'audio</Text>
            <FlatList
                data={audioFiles}
                keyExtractor={(item) => item}
                renderItem={({ item }) => (
                    <View style={styles.audioItem}>
                        <TouchableOpacity onPress={() => navigateToNextTab(item)}>
                            <Text style={styles.audioText}>{item}</Text>
                        </TouchableOpacity>
                        <Button title="Play" onPress={() => playAudio(item)} />
                        <Button title="Delete" onPress={() => deleteAudio(item)} />
                    </View>
                )}
            />
            <Button title="Sélectionner audio du téléphone" onPress={selectAudioFromPhone} />
        </View>
    );
}

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
