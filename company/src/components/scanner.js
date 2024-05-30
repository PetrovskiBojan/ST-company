// Function to run when the DOM is fully loaded
function domReady(fn) {
    if (document.readyState === "complete" || document.readyState === "interactive") {
        setTimeout(fn, 1000);
    } else {
        document.addEventListener("DOMContentLoaded", fn);
    }
}

// Function to use speech synthesis
function speak(message) {
    const synth = window.speechSynthesis;
    const utterance = new SpeechSynthesisUtterance(message);
    synth.speak(utterance);
}

// Function to create title based on localStorage type
window.onload = createTitle;
function createTitle() {
    const type = localStorage.getItem('type');
    if (type === "vhod") {
        speak("Ready for check in");
        document.getElementById('tip').innerHTML = "CHECK IN";
    }
    if (type === "izhod") {
        speak("Ready for check out");
        document.getElementById('tip').innerHTML = "CHECK OUT";
    }
}

// Function to return to home
function returnHome() {
    localStorage.removeItem('type');
    window.location.href = 'landing.html';
}

// Initialize IndexedDB
let db;
const request = indexedDB.open("QRScannerDB", 1);

request.onupgradeneeded = function (event) {
    db = event.target.result;
    const objectStore = db.createObjectStore("scannedData", { keyPath: "id", autoIncrement: true });
    objectStore.createIndex("userID", "userID", { unique: false });
    objectStore.createIndex("token", "token", { unique: false });
    objectStore.createIndex("type", "type", { unique: false });
};

request.onsuccess = function (event) {
    db = event.target.result;
    console.log("IndexedDB initialized");

    // Sync data if online
    if (navigator.onLine) {
        syncOfflineData();
    }
};

request.onerror = function (event) {
    console.error("Error initializing IndexedDB:", event.target.errorCode);
};

// Function to store scan data in IndexedDB
function storeScanData(userID, token, type) {
    const transaction = db.transaction(["scannedData"], "readwrite");
    const objectStore = transaction.objectStore("scannedData");
    const data = { userID, token, type, timestamp: new Date() };
    objectStore.add(data);
    transaction.oncomplete = function () {
        console.log("Scan data stored for offline use.");
        text = (type === "vhod" ? "in" : "out");
        speak("Successfuly checked " + text);
        // Show popup notification
        alert("Scan data stored for offline use.");

        // Enable scanner after showing the popup
        setTimeout(() => {
            scannerActive = true;
        }, 3000); // 3 seconds cooldown
    };
    transaction.onerror = function (event) {
        console.error("Error storing scan data:", event.target.errorCode);

        // Show popup notification for error
        alert("Error storing scan data.");

        // Enable scanner after showing the popup
        setTimeout(() => {
            scannerActive = true;
        }, 3000); // 3 seconds cooldown
    };
}


// Function to sync offline data
function syncOfflineData() {
    const transaction = db.transaction(["scannedData"], "readonly");
    const objectStore = transaction.objectStore("scannedData");
    const request = objectStore.getAll();

    request.onsuccess = function (event) {
        const data = event.target.result;
        data.forEach(record => {
            const url = `http://localhost:3000/users/${record.userID}/record`;
            fetch(url, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${record.token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ type: record.type })
            })
                .then(response => {
                    if (!response.ok) {
                        throw new Error('Failed to fetch report.');
                    }
                    return response.json();
                })
                .then(data => {
                    console.log('Offline data synced:', data);
                    // Remove synced record from IndexedDB
                    const deleteTransaction = db.transaction(["scannedData"], "readwrite");
                    const deleteStore = deleteTransaction.objectStore("scannedData");
                    deleteStore.delete(record.id);
                })
                .catch(error => {
                    console.error('Error syncing offline data:', error);
                });
        });
    };

    request.onerror = function (event) {
        console.error("Error retrieving offline data:", event.target.errorCode);
    };
}

// Define a variable to control scanner activity
let scannerActive = true;

domReady(function () {
    // Function to handle QR code scan success
    function onScanSuccess(decodeText, decodeResult) {
        try {
            if (!scannerActive) return; // Check if scanner is active

            // Disable scanner to prevent multiple scans
            scannerActive = false;

            // Parse the JSON data from the QR code
            const data = JSON.parse(decodeText);
            const userID = data.userID;
            const token = data.token;
            const type = localStorage.getItem('type');
            if (!type) {
                throw new Error('Type not found in localStorage.');
            }
            const url = `http://localhost:3000/users/${userID}/record`;

            // Log the URL to the console (for debugging purposes)
            console.log(`Calling URL: ${url}`);

            // Check if online before making the request
            if (navigator.onLine) {
                fetch(url, {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({ type })
                })
                    .then(response => {
                        if (!response.ok) {
                            throw new Error('Failed to fetch report.');
                        }
                        return response.json();
                    })
                    .then(data => {
                        console.log('Response:', data);
                        let text = `${data.ime} has checked ${(type === "vhod" ? "in" : "out")}`;
                        speak(text);
                        alert('Report fetched successfully.');

                        // Enable scanner after showing the popup
                        setTimeout(() => {
                            scannerActive = true;
                        }, 3000); // 3 seconds cooldown
                    })
                    .catch(error => {
                        console.error('Error fetching report:', error);
                        alert('Failed to fetch report.');
                        // Store data offline if request fails
                        storeScanData(userID, token, type);

                        // Enable scanner after handling the error
                        scannerActive = true;
                    });
            } else {
                // Store data offline if not online
                storeScanData(userID, token, type);

                // Enable scanner after storing data offline
                scannerActive = true;
            }
        } catch (e) {
            console.error('Error:', e);
            alert(e.message);

            // Enable scanner after handling the error
            scannerActive = true;
        }
    }

    // Initialize the QR code scanner
    const htmlscanner = new Html5QrcodeScanner("my-qr-reader", { fps: 10, qrbox: 250 });
    htmlscanner.render(onScanSuccess);
});
