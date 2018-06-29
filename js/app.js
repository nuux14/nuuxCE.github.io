

if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('./sw.js').then(reg => {

        if (reg.installing) {
            console.log('Service worker installing');
        } else if (reg.waiting) {
            console.log('Service worker installed');
        } else if (reg.active) {
            console.log('Service worker active');
        }
    }).catch(error => console.log('Registration failed with ' + error));
}


function CurrListFromNetwork() {
    // If the browser doesn't support service worker,
    // we don't care about having a database
    if (!navigator.serviceWorker) {
        return Promise.resolve();
    }
    if (window.indexedDB) {
        var request = window.indexedDB.open("TestDB", 6);
        request.onupgradeneeded = function (event) {
            var db = event.target.result;
            var objectStore = db.createObjectStore("currencies", { keyPath: "id" });
            objectStore.transaction.oncomplete = function (event) {
                // Store values in the newly created objectStore.
                const urlCurrList = `https://free.currencyconverterapi.com/api/v5/currencies`;
                const currList = new Array();
                fetch(urlCurrList)
                    .then(function (response) {
                        return response.json();
                    }).then(function (myJson) {
                        const x = Object.values(myJson.results);
                        console.log('you are fetching. that is bad o fyou');
                        for (const key of x) {
                            currList.push(key);//
                        }
                        var currObjectStore = db.transaction("currencies", "readwrite").objectStore("currencies");
                        currList.forEach(function (c) {
                            currObjectStore.add(c);
                        });
                        window.location.reload();
                    }).catch(error => {
                        console.log('Couldnt fetch for now' + error);
                    });
            };
        }
    }  

}


function getData() {
    var DBOpenRequest = window.indexedDB.open("TestDB", 6); let dataFound = false;
    let sel = document.getElementById('drpCurr1');
    let sel2 = document.getElementById('drpCurr2');
    DBOpenRequest.onsuccess = function (event) {
        db = DBOpenRequest.result;
        CurrListFromNetwork();
        const transaction = db.transaction(["currencies"], "readwrite");
        transaction.oncomplete = function (event) {
        };
        transaction.onerror = function (event) {
            note.innerHTML += '<li>Transaction not opened due to error: ' + transaction.error + '</li>';                   
        };
        let objectStoreRequest = transaction.objectStore("currencies").getAll();
        objectStoreRequest.onsuccess = (event) => {
            objectStoreRequest.result.forEach(x => {
                dataFound = true;
                let opt = document.createElement('option');
                let opt2 = document.createElement('option');
                opt.value = x.id;
                opt.text = x.currencyName + ' (' + x.id + ')';
                opt2 = opt.cloneNode(true);
                sel.add(opt);
                sel2.add(opt2);
                return true;
            });
        };        
    }
};



//Click Event
const ConvBtn = document.getElementById("ConvBtn");

ConvBtn.addEventListener("click", () => {
    const drp1 = document.getElementById('drpCurr1');
    const drp2 = document.getElementById('drpCurr2');
    const lbl = document.getElementById('result');
    const txtAmt = document.getElementById('amount');
    const val1 = drp1.options[drp1.selectedIndex].value;
    const val2 = drp2.options[drp2.selectedIndex].value;

    const url = `https://free.currencyconverterapi.com/api/v5/convert?q=${val1}_${val2},${val2}_${val1}&compact=ultra`;
    fetch(url).then(resp => {
        return resp.json();
    }).then(response => {

        const amount = txtAmt.value == '' ? 1 : txtAmt.value;
        const y = Object.values(response);
        lbl.innerHTML = `${amount} ${val1}  =  ${y[0] * amount}  ${val2}`;
        //    rate.innerText=`Exchange Rate 1 ${val1} = ${y[0]} ${val2}`;

    });
});



function add() {
	var request = db.transaction(["customers"], "readwrite")
                .objectStore("customers")
                .add({ id: "00-03", name: "Kenny", age: 19, email: "kenny@planet.org" });
				
	request.onsuccess = function(event) {
	  	alert("Kenny has been added to your database.");
	};
	
	request.onerror = function(event) {
		alert("Unable to add data\r\nKenny is aready exist in your database! ");	
	}
	
}

CurrListFromNetwork();
getData();
