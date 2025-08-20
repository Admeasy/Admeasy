import styled from 'styled-components';
import { TiHome } from "react-icons/ti";
import { FaSearch } from "react-icons/fa";
import { MdOutlineMarkUnreadChatAlt } from "react-icons/md";
import { useNavigate } from 'react-router-dom';
import { useState } from 'react';
  const FooterBtn = ({text,ShowIcon = null}) => {
    const navigate = useNavigate();
  return (
    <StyledWrapper>
      <button className="btn-cssbuttons">
        <span>{text}</span>
        
           
          {ShowIcon && (
            <span> <svg height={18} width={18} xmlns="http://www.w3.org/2000/svg" version="1.1" viewBox="0 0 1024 1024" className="icon">
            <path fill="#ffffff" d="M767.99994 585.142857q75.995429 0 129.462857 53.394286t53.394286 129.462857-53.394286 129.462857-129.462857 53.394286-129.462857-53.394286-53.394286-129.462857q0-6.875429 1.170286-19.456l-205.677714-102.838857q-52.589714 49.152-124.562286 49.152-75.995429 0-129.462857-53.394286t-53.394286-129.462857 53.394286-129.462857 129.462857-53.394286q71.972571 0 124.562286 49.152l205.677714-102.838857q-1.170286-12.580571-1.170286-19.456 0-75.995429 53.394286-129.462857t129.462857-53.394286 129.462857 53.394286 53.394286 129.462857-53.394286 129.462857-129.462857 53.394286q-71.972571 0-124.562286-49.152l-205.677714 102.838857q1.170286 12.580571 1.170286 19.456t-1.170286 19.456l205.677714 102.838857q52.589714-49.152 124.562286-49.152z" />
          </svg>  
          </span>
        )}

          
      
        <ul className='flex items-center justify-center'>
          <li>
            <div
            onClick={() => navigate("/colleges")}
             title="Find Colleges"
            >
              <FaSearch/>
            </div>
          </li>
          <li>
            <div
            className='text-[18px]'
            onClick={()=>navigate("/")}
            title='Home'
            >
            <TiHome/>
            </div> 
                     </li>
          <li>
            <div
            onClick={() => navigate("/mentors")} 
            title="Talk To Mentors"
            >
              <MdOutlineMarkUnreadChatAlt/>
              </div>
            </li></ul></button>
    </StyledWrapper>
  );
}

const StyledWrapper = styled.div`
  .btn-cssbuttons {
   --btn-color: #275efe;
   position: relative;
   padding: 16px 32px;
   font-family: Roboto, sans-serif;
   font-weight: 500;
   font-size: 16px;
   line-height: 1;
   color: white;
   background: none;
   border: none;
   outline: none;
   overflow: hidden;
   cursor: pointer;
   filter: drop-shadow(0 2px 8px rgba(39, 94, 254, 0.32));
   transition: 0.3s cubic-bezier(0.215, 0.61, 0.355, 1);
  }

  .btn-cssbuttons::before {
   position: absolute;
   content: "";
   top: 0;
   left: 0;
   z-index: -1;
   width: 100%;
   height: 100%;
   background: var(--btn-color);
   border-radius: 24px;
   transition: 0.3s cubic-bezier(0.215, 0.61, 0.355, 1);
  }

  .btn-cssbuttons span,
  .btn-cssbuttons span span {
   display: inline-flex;
   vertical-align: middle;
   transition: 0.3s cubic-bezier(0.215, 0.61, 0.355, 1);
  }

  .btn-cssbuttons span {
   transition-delay: 0.05s;
  }

  .btn-cssbuttons span:first-child {
   padding-right: 7px;
  }

  .btn-cssbuttons span span {
   margin-left: 8px;
   transition-delay: 0.1s;
  }

  .btn-cssbuttons ul {
   position: absolute;
   top: 50%;
   left: 0;
   right: 0;
   display: flex;
   margin: 0;
   padding: 0;
   list-style-type: none;
   transform: translateY(-50%);
  }

  .btn-cssbuttons ul li {
   flex: 1;
  }

  .btn-cssbuttons ul li div {
   display: inline-flex;
   vertical-align: middle;
   transform: translateY(55px);
   transition: 0.3s cubic-bezier(0.215, 0.61, 0.355, 1);
  }

  .btn-cssbuttons ul li div:hover {
   opacity: 0.5;
  }

  .btn-cssbuttons:hover::before {
   transform: scale(1.2);
  }

  .btn-cssbuttons:hover span,
  .btn-cssbuttons:hover span span {
   transform: translateY(-55px);
  }

  .btn-cssbuttons:hover ul li div {
   transform: translateY(0);
  }

  .btn-cssbuttons:hover ul li:nth-child(1) div {
   transition-delay: 0.15s;
  }

  .btn-cssbuttons:hover ul li:nth-child(2) div {
   transition-delay: 0.2s;
  }

  .btn-cssbuttons:hover ul li:nth-child(3) div {
   transition-delay: 0.25s;
  }`;

export default FooterBtn;
