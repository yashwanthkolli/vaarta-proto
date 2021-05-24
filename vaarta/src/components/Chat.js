import React, { useEffect, useState } from 'react'
import io from 'socket.io-client'
import queryString from 'query-string'

const Chat = ({location}) => {
    const [name, setName] = useState('')
    const [room, setRoom] = useState('')

    useEffect(() => {
        const { name, room } = queryString.parse(location.search)
        
        const socket = io('localhost:3001')

        setName(name)
        setRoom(room)

        socket.emit('join', {room, name})
        socket.emit('createRoom', {room_id: room})
    }, [location])
    
    return(
        <h1>Chat</h1>
    )
}

export default Chat