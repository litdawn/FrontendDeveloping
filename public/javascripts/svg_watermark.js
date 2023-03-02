

function set_svg(){

    const svg = document.getElementById("svg");

    let text = document.getElementsByTagName("text")[0];
    text.textContent = "201250206 dcc";

    const s = new XMLSerializer().serializeToString(svg);
    //
    const img = `data:image/svg+xml;base64,${window.btoa(s)}`;
    //
    svg.remove();
    const background = document.getElementsByClassName('watermark')[0];
    background.style.background = "url('"+img+"')";

}

set_svg();