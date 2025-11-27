import { useNavigate } from 'react-router-dom';
import styled from 'styled-components';


const ExploreBtn = ({ text = 'Explore', isSticky = true, linkbtn }) => {
  const navigate = useNavigate();
  const positionClass = isSticky ? 'absolute bottom-0 right-0' : 'static';

  const handleClick = (e) => {
    e.stopPropagation();
    navigate(linkbtn);
  };

  return (
    <StyledWrapper>
      <div className={`btn-container ${positionClass} flex justify-center`}>
        {/* <button
  type="button"
  onClick={handleClick}
  className="cursor-pointer bg-blue-900 hover:bg-blue-800 active:translate-y-0.5 active:shadow-none text-white font-semibold px-6 py-3 rounded-lg shadow-md hover:shadow-lg transition-all duration-200 transform"
> */}
     <button 
     type="button"
  onClick={handleClick}
 className="relative flex active:scale-95 items-center justify-end text-white hover:text-blue-800 font-admeasy bg-[#3654ff] border-2 border-[#3654ff] px-3 py-2 cursor-pointer rounded-[11px] transition-all duration-500 hover:bg-transparent overflow-hidden">
      <svg
        xmlns="http://www.w3.org/2000/svg"
        fill="none"
        viewBox="0 0 24 24"
        strokeWidth={1.5}
        stroke="currentColor"
        className="w-[1.6em] h-[1.6em] absolute left-3 transition-transform duration-500 ease-in-out group-hover:translate-x-1"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M4.5 12h15m0 0l-6.75-6.75M19.5 12l-6.75 6.75"
        />
      </svg>

      <div className="ml-8">{text}</div>
    </button>
      </div>
    </StyledWrapper>
  );
}
// OLD Design
// --color-background: #ff135a;  --color-outline: #ff145b80;
// styling for Explorebtn
const StyledWrapper = styled.div`
 .btn-container {
  --color-text: #ffffff;
  --color-background: #ff9900;
  --color-outline: #ff990080;
  --color-shadow: #ffa72680;
}


  .btn-content {
    display: flex;
    align-items: center;
    padding: 5px 10px;
    text-decoration: none;
    font-family: 'Poppins', sans-serif;
    font-weight: 600;
    font-size: 20px;
    color: white;
    transition: 1s;
    border-radius: 100px;
    box-shadow: 0 0 8px 0 red;
  }

  .btn-content:hover, .btn-content:focus {
    transition: 0.5s;
    -webkit-animation: btn-content 1s;
    animation: btn-content 1s;
    outline: 0.1em solid transparent;
    outline-offset: 0.2em;
    box-shadow: 0 0 0.4em 0 red;
  }

  .btn-content .icon-arrow {
    transition: 0.5s;
    margin-right: 0px;
    transform: scale(0.6);
  }

  .btn-content:hover .icon-arrow {
    transition: 0.5s;
    margin-right: 15px;
  }

  .icon-arrow {
    width: 20px;
    margin-left: 15px;
    position: relative;
    top: 6%;
  }

  /* SVG */
  #arrow-icon-one {
    transition: 0.4s;
    transform: translateX(-60%);
  }

  #arrow-icon-two {
    transition: 0.5s;
    transform: translateX(-30%);
  }

  .btn-content:hover #arrow-icon-three {
    animation: color_anim 1s infinite 0.2s;
  }

  .btn-content:hover #arrow-icon-one {
    transform: translateX(0%);
    animation: color_anim 1s infinite 0.6s;
  }

  .btn-content:hover #arrow-icon-two {
    transform: translateX(0%);
    animation: color_anim 1s infinite 0.4s;
  }

  /* SVG animations */
  @keyframes color_anim {
    0% {
      fill: white;
    }

    50% {
      fill: var(--color-background);
    }

    100% {
      fill: white;
    }
  }

  /* Button animations */
  @-webkit-keyframes btn-content {
    0% {
      outline: 0.2em solid var(--color-background);
      outline-offset: 0;
    }
  }

  @keyframes btn-content {
    0% {
      outline: 0.2em solid var(--color-background);
      outline-offset: 0;
    }
  }`;

export default ExploreBtn;
