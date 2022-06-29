import React, { useRef, useState, useEffect } from "react"
import { firestore, storage } from "./firebase"
import { addDoc, collection } from "firebase/firestore"
import { ref, uploadBytes, getDownloadURL } from "firebase/storage"
import { v4 } from "uuid"

export default function Home() {
    const messageRef = useRef()
    const collectionRef = collection(firestore, "messages")

    const handleSave = async (e) => {
        e.preventDefault()
        console.log(messageRef.current.value)

        let data = {
            message: messageRef.current.value,
        }

        try {
            addDoc(collectionRef, data)
        } catch (e) {
            console.log(e)
        }
    }

    const [imageUpload, setImageUpload] = useState(null)
    const [imageURL, setImageURL] = useState(null)
    const uploadImage = () => {
        if (imageUpload == null) return
        const imageRef = ref(storage, `images/${imageUpload.name + v4()}`)
        uploadBytes(imageRef, imageUpload).then((snapshot) => {
            alert("Image Uploaded")
            getDownloadURL(snapshot.ref).then(url => setImageURL(url))
        }).then(console.log(imageURL))
    };

    useEffect(() => { }, [])

    return (
        <div className="App">
            <div>HOME ROUTE</div>
            <div>
                <form onSubmit={handleSave}>
                    <label>Enter message</label>
                    <input type="text" ref={messageRef} />
                    <button type="submit">Save</button>
                </form>
            </div>
            <div>
                <input type="file" onChange={(event) => { setImageUpload(event.target.files[0]) }} />
                <button onClick={uploadImage}>Upload</button>
            </div>
        </div>
    )
}