import React, { useState, useEffect } from 'react';
import { View, Button, TextInput, StyleSheet, Alert, Platform } from 'react-native';
import { Audio } from 'expo-av';
import * as FileSystem from 'expo-file-system';
import * as Permissions from 'expo-permissions';
import {useRoute} from "@react-navigation/native";

export default function RecordScreen({navigation}) {
    const route = useRoute();
    const {ipAdress, port} = route.params;
    const [recording, setRecording] = useState(null);
    const [sound, setSound] = useState(null);
    const [fileName, setFileName] = useState('');
    const [recordingUri, setRecordingUri] = useState('');

    useEffect(() => {
        return sound
            ? () => {
                sound.unloadAsync();
            }
            : undefined;
    }, [sound]);

    const startRecording = async () => {
        try {
            const permission = await Audio.requestPermissionsAsync();
            if (permission.status === 'granted') {
                await Audio.setAudioModeAsync({
                    allowsRecordingIOS: true,
                    playsInSilentModeIOS: true,
                });

                const { recording } = await Audio.Recording.createAsync(
                    Audio.RECORDING_OPTIONS_PRESET_HIGH_QUALITY
                );
                setRecording(recording);
            } else {
                Alert.alert('Permission required', 'Please grant audio recording permission.');
            }
        } catch (err) {
            console.error('Failed to start recording', err);
        }
    };

    const stopRecording = async () => {
        setRecording(undefined);
        await recording.stopAndUnloadAsync();
        const uri = recording.getURI();
        setRecordingUri(uri);
        Alert.alert('Recording stopped and saved', `File saved at ${uri}`);
    };

    const playSound = async () => {
        if (recordingUri) {
            const { sound } = await Audio.Sound.createAsync({ uri: recordingUri });
            setSound(sound);
            await sound.playAsync();
        }
    };

    const pauseSound = async () => {
        if (sound) {
            await sound.pauseAsync();
        }
    };

    const saveAudio = async () => {
        if (recordingUri && fileName) {
            const externalDir = FileSystem.externalStorageDirectory || FileSystem.documentDirectory;
            const newUri = `${externalDir}${fileName}.m4a`;
            await FileSystem.moveAsync({
                from: recordingUri,
                to: newUri,
            });
            setRecordingUri(newUri);
            Alert.alert('Audio Saved', `File saved as ${newUri}`);
        } else {
            Alert.alert('Error', 'Please provide a file name and make a recording first.');
        }
    };

    const deleteAudio = async () => {
        if (recordingUri) {
            await FileSystem.deleteAsync(recordingUri);
            setRecordingUri('');
            setFileName('');
            Alert.alert('Audio Deleted', 'The recording has been deleted.');
        }
    };

    const getPermissions = async () => {
        if (Platform.OS === 'android') {
            const { status } = await Permissions.askAsync(Permissions.MEDIA_LIBRARY);
            if (status !== 'granted') {
                Alert.alert('Permission required', 'Please grant storage permission to save files.');
            }
        }
    };

    const goNext = async () => {
        navigation.navigate('ManageAudio', {ipAdress, port});
    }

    useEffect(() => {
        getPermissions();
    }, []);

    return (
        <View style={styles.container}>
            <Button title={recording ? 'Stop Recording' : 'Start Recording'} onPress={recording ? stopRecording : startRecording} />
            <Button title={'Play'} onPress={playSound} />
            <Button title={'Pause'} onPress={pauseSound} />
            <Button title={'Delete'} onPress={deleteAudio} />
            <TextInput
                placeholder="Enter file name"
                value={fileName}
                onChangeText={setFileName}
                style={styles.input}
            />
            <Button title={'Save Audio'} onPress={saveAudio} />

            <Button title={"Gestion"} onPress={goNext}/>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'center',
        padding: 16,
    },
    input: {
        height: 40,
        borderColor: 'gray',
        borderWidth: 1,
        marginBottom: 12,
        paddingHorizontal: 8,
    },
});
