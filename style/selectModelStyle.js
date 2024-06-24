import {StyleSheet} from "react-native";

export const selectModelStyle = StyleSheet.create({
        container: {
            flex: 1,
        },

        picker: {
            marginLeft: 10,
            marginRight: 10,

        },

        title: {
            marginTop: 20,
            marginBottom: 20,
            textAlign: 'center',
            fontWeight: 'bold',
            fontSize: 24
        },

        button: {
            alignItems: "center",
            backgroundColor: 'black',
            height: 40,
            borderRadius: 25,
            paddingLeft: 20,
            paddingRight: 20,
            paddingTop: 10,
            paddingBottom: 10,
            marginTop: 10,
            marginBottom: 10,
            marginRight: 10,
            marginLeft: 10
        },

        buttonText: {
            color: 'white',
        },

        text: {
            marginLeft: 15,
            marginRight: 15,
            fontSize: 15,
            marginBottom: 5,
            marginTop: 5
        },

        loadingContainer:{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            justifyContent: 'center',
            alignItems: 'center',
        },

        inputText:{
            marginTop:20,
            marginBottom:20,
            marginLeft:15,
            marginRight:15,
            borderWidth:1,
            height:45
        }
});