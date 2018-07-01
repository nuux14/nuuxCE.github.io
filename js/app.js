
/*
* THIS WORK BELONGS TO MUBAREK MOHAMMED
* SERVICE WORKER REGISTRATION
*/
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

/*
* GET CURRENCY LIST FROM NETWORK IF IT IS THE FIRST TIME OR THERE'S NO indexedDB
*/
let request = window.indexedDB.open("ceDB", 1);



function CurrListFromNetwork() {
    // If the browser doesn't support service worker,
    // we don't care about having a database
    if (!navigator.serviceWorker) {
        return Promise.resolve();
    }
    if (window.indexedDB) {

        request.onupgradeneeded = event =>{
            const db = event.target.result;
            const objectStore = db.createObjectStore("currencies", { keyPath: "id" });
            const objectStoreRate = db.createObjectStore("exchRates", { keyPath: "id" });
            objectStore.transaction.oncomplete = event => {
                // Store values in the newly created objectStore.
                const urlCurrList = `https://free.currencyconverterapi.com/api/v5/currencies`;
                const currList = new Array();
                fetch(urlCurrList)
                    .then( response => {
                        return response.json();
                    }).then( myJson=> {
                        const x = Object.values(myJson.results);
                        for (const key of x) {
                            currList.push(key);//
                        }
                        const currObjectStore = db.transaction("currencies", "readwrite").objectStore("currencies");
                        currList.forEach( c => {
                            currObjectStore.add(c);
                        });
                        window.location.reload();
                    }).catch(error => {
                        //console.log('Couldnt fetch for now' + error);
                    });
            };
        }
    }

}


/*
*  POPULATE THE CURRENCY LIST ELEMENTS
*/
function getData() {   
    let sel = document.getElementById('drpCurr1');
    let sel2 = document.getElementById('drpCurr2');
    request.onsuccess = event => {
        db = request.result;
        CurrListFromNetwork();
        const transaction = db.transaction(["currencies"], "readwrite");
        transaction.oncomplete = event => {
        };
        transaction.onerror = event => {
           // note.innerHTML += '<li>Test</li>';
        };
        let objectStoreRequest = transaction.objectStore("currencies").getAll();
        objectStoreRequest.onsuccess = event => {
            objectStoreRequest.result.forEach(x => {              
                let opt = document.createElement('option');
                let opt2 = document.createElement('option');
                opt.value = x.id;
                opt.text = x.currencyName + ' (' + x.id + ')';
                opt2 = opt.cloneNode(true);
                sel.add(opt);
                sel2.add(opt2);               
            });
        };
    }
};



/*
* CONVERT BUTTON 
*/
const ConvBtn = document.getElementById("ConvBtn");
/*
* CONVERT BUTTON CLICK EVENT
*/
ConvBtn.addEventListener("click", () => {
    const drp1 = document.getElementById('drpCurr1');
    const drp2 = document.getElementById('drpCurr2');
    const lbl = document.getElementById('result');
    const txtAmt = document.getElementById('amount');
    const fromCurr = drp1.options[drp1.selectedIndex].value;
    const toCurr = drp2.options[drp2.selectedIndex].value;


    const req = window.indexedDB.open("ceDB", 1);
    req.onsuccess = event => {
        db = req.result;
        let tx = db.transaction(["exchRates"]);
        let obRate = tx.objectStore("exchRates");
        let reqobRate = obRate.get(`${fromCurr}_${toCurr}`);
        reqobRate.onerror = event => {
            return -1;
        };
        reqobRate.onsuccess = event => {
                /*  
                * CHECK IF RATE EXIST IN DB AND          
                * IF 60 MINUTES DIDN'T ELAPSE
               */               
            if (reqobRate.result && ((Date.now() - reqobRate.result.dateReceived) / 60000 < 60 )) {  /* RATE IS IN THE CACHE WE SERVE */
             
               
                    const amount = txtAmt.value == '' ? 1 : txtAmt.value;
                    const rate = reqobRate.result.value;
                    lbl.innerHTML = `${amount} ${fromCurr}  =  ${(rate * amount).toFixed(2)}  ${toCurr}`;
                //   console.log('rate served from cache');
               

            } else { /* IF IT IS NOT IN THE CACHE WE FETCH FROM NETWORK */
                const url = `https://free.currencyconverterapi.com/api/v5/convert?q=${fromCurr}_${toCurr},${toCurr}_${fromCurr}&compact=ultra`;
                fetch(url).then(resp => {
                    return resp.json();
                }).then(response => {
                    const amount = txtAmt.value == '' ? 1 : txtAmt.value;
                    const y = Object.values(response);
                    lbl.innerHTML = `${amount} ${fromCurr}  =  ${(y[0] * amount).toFixed(2)}  ${toCurr}`;
                   // console.log('rate served from Network');
                    add(fromCurr, toCurr, y);
                });
            }
        }
    };
});
/*
* SAVES RATES TO DB, DB CONNECTION IS USED REPEATEDLY ON PURPOSE
* BECAUSE I HAVE DIFFICULTY WORKING WITH INDEXDB BROWSER API
* THIS WORK BELONGS TO MUBAREK MOHAMMED
*/ 
function add(fromCurr, toCurr, y) {
    const req = window.indexedDB.open("ceDB", 1);
    req.onsuccess = event => {
        db = req.result;
        const tx = db.transaction(["exchRates"], "readwrite");
        tx.objectStore('exchRates').delete(`${toCurr}_${fromCurr}`);
        tx.objectStore('exchRates').delete(`${fromCurr}_${toCurr}`);
        tx.objectStore('exchRates').add({ id: `${fromCurr}_${toCurr}`, value: y[0], dateReceived: Date.now() });
        tx.objectStore('exchRates').add({ id: `${toCurr}_${fromCurr}`, value: y[1], dateReceived: Date.now() });
    }
    req.onerror = event => {/*  TO BE USED FOR INFORMING THE USER   */ }
}

CurrListFromNetwork();
getData();
