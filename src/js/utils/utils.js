const HD_HARDENED: number = 0x80000000;

export function satoshi2btc(s: number): number {
    return (s / 100000000);
}

export function getSplitBlock(): number {
    return fetch(`config.json?r=${ Math.random() }`).then(response => {
        var contentType = response.headers.get("content-type");
        if(contentType && contentType.includes("application/json")) {
            return response.json();
        }
        throw new TypeError("Not a JSON");
    }).catch(function(error) { console.log(error); });
}

export function getValidInputs(inputs: Array<Object>): Array<Object> {
    let validInputs = [];
    // TODO: find unspents before block number
    for(let input of inputs){
        console.log("input", input);
    }
}

export function calculateFee(inputs: number, outputs: number, feePerByte: number): number {    
    let inputFee = (inputs * 149 + outputs * 35) * feePerByte;
    return inputFee;
}

export function getSerializedPath(path: Array<number>): string {
    return path.map((i) => {
        let s = (i & ~HD_HARDENED).toString();
        if (i & HD_HARDENED) {
            return s + "'";
        } else {
            return s;
        }
    }).join('/');
}

export function getBitcoinCashPathFromIndex(index: number) {
    // return getSerializedPath([
    //     (44 | HD_HARDENED) >>> 0,
    //     (145 | HD_HARDENED) >>> 0,
    //     (index | HD_HARDENED) >>> 0
    // ]);

    return [
        (44 | HD_HARDENED) >>> 0,
        (145 | HD_HARDENED) >>> 0,
        (index | HD_HARDENED) >>> 0
    ];
}