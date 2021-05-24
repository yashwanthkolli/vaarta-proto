import React, { useState } from 'react'
import { Link } from 'react-router-dom'

const Join = () => {
    const [name, setName] = useState('')
    const [room, setRoom] = useState('')
    return(
        <form>
            <input placeholder='Name' type='text' onChange={(e) => setName(e.target.value)} required/>
            <input placeholder='Room' type='text' onChange={(e) => setRoom(e.target.value)} required/>
            <Link onClick={e => (!name || !room) ? e.preventDefault() : null} to={`/chat?name=${name}&room=${room}`}>
                <button type='submit'>Join</button>
            </Link>
        </form>
    )
}

export default Join