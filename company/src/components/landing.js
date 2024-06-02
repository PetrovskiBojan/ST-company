import React from 'react';
import '../css/landing.css';

const Landing = () => {
    const handleCheckInClick = () => {
        localStorage.setItem('type', 'vhod');
    };

    const handleCheckOutClick = () => {
        localStorage.setItem('type', 'izhod');
    };

    return (
        <div className="split-container">
            <div id="checkIn" className="split left" onClick={handleCheckInClick}>
                <a href="index.html" className="link">Check In</a>
            </div>
            <div id="checkOut" className="split right" onClick={handleCheckOutClick}>
                <a href="index.html" className="link">Check Out</a>
            </div>
        </div>
    );
}

export default Landing;
