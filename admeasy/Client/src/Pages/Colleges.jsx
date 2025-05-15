import React from 'react'
import CollegesData from '../assets/CollegesData.json'
const Colleges = () => {
  return (
    <div>
      {CollegesData.map(
        (items,idx)=>{
          <div key={idx}></div>
        }
      )}
    </div>
  )
}

export default Colleges