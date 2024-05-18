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

domReady(function () {
    // Function to handle QR code scan success
    function onScanSuccess(decodeText, decodeResult) {
        try {
            // Parse the JSON data from the QR code
            const data = JSON.parse(decodeText);

            // Extract the userID and token from the parsed data
            const userID = data.userID;
            const token = data.token;

            // Construct the URL for the endpoint
            const url = `http://localhost:3000/users/${userID}/record`;

            // Log the URL to the console (for debugging purposes)
            console.log(`Calling URL: ${url}`);

            // Make the HTTP POST request to the endpoint
            fetch(url, {
                method: 'POST', // Specify the method as POST
                headers: {
                    'Content-Type': 'application/json' // Specify the content type as JSON
                },
                body: JSON.stringify(data) // Convert the data to JSON string and include in the body
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
                    alert('Report fetched successfully.');
                })
                .catch(error => {
                    // Handle any errors
                    console.error('Error fetching report:', error);
                    alert('Failed to fetch report.');
                });
        } catch (e) {
            // Handle JSON parsing errors
            console.error('Error parsing QR code data:', e);
            alert('Invalid QR code data.');
        }
    }

    let htmlscanner = new Html5QrcodeScanner(
        "my-qr-reader",
        { fps: 10, qrbox: 250 }
    );
    htmlscanner.render(onScanSuccess);
});
