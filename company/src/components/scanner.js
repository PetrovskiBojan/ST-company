function domReady(fn) {
    if (
        document.readyState === "complete" ||
        document.readyState === "interactive"
    ) {
        setTimeout(fn, 1000);
    } else {
        document.addEventListener("DOMContentLoaded", fn);
    }
}

function speak(message) {
    const synth = window.speechSynthesis;
    const utterance = new SpeechSynthesisUtterance(message);
    synth.speak(utterance);
}

window.onload = createTitle;
function createTitle() {
    const type = localStorage.getItem('type');
    if (type === "vhod") {
        speak("Ready for check in")
        document.getElementById('tip').innerHTML = "CHECK IN";
    }
    if (type === "izhod") {
        speak("Ready for check out")
        document.getElementById('tip').innerHTML = "CHECK OUT";
    }
}
function returnHome() {
    localStorage.removeItem('type');
    window.location.href = 'landing.html'
}
domReady(function () {
    // Function to handle QR code scan success
    function onScanSuccess(decodeText, decodeResult) {
        try {
            // Parse the JSON data from the QR code
            const data = JSON.parse(decodeText);

            // Extract the userID and token from the parsed data
            const userID = data.userID;
            const token = data.token;

            // Retrieve the type from localStorage
            const type = localStorage.getItem('type');
            console.log(type)
            document.getElementById("tip").innerHTML = type;

            if (!type) {
                throw new Error('Type not found in localStorage.');
            }

            // Construct the URL for the endpoint
            const url = `http://localhost:3000/users/${userID}/record`;

            // Log the URL to the console (for debugging purposes)
            console.log(`Calling URL: ${url}`);

            // Make the HTTP POST request to the endpoint
            fetch(url, {
                method: 'POST', // Specify the method as POST
                headers: {
                    'Authorization': `Bearer ${token}`, // Include JWT token as Bearer token
                    'Content-Type': 'application/json' // Specify the content type as JSON
                },
                body: JSON.stringify({ type }) // Include only the type from localStorage
            })
                .then(response => {
                    if (!response.ok) {
                        throw new Error('Failed to fetch report.');
                    }

                    return response.json();
                })
                .then(data => {
                    // Handle the response data as needed
                    console.log('Response:', data);
                    let text = data.ime + "has checked" + (type == "vhod" ? "in" : "out")
                    speak(text);
                    alert('Report fetched successfully.');
                })
                .catch(error => {
                    // Handle any errors
                    console.error('Error fetching report:', error);
                    alert('Failed to fetch report.');
                });
        } catch (e) {
            // Handle JSON parsing errors and localStorage errors
            console.error('Error:', e);
            alert(e.message);
        }
    }

    let htmlscanner = new Html5QrcodeScanner(
        "my-qr-reader",
        { fps: 10, qrbox: 250 }
    );
    htmlscanner.render(onScanSuccess);
});


