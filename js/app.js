
function toggleMenu(){const nav=document.getElementById("siteNav");if(nav)nav.classList.toggle("open")}
document.addEventListener("click",e=>{const nav=document.getElementById("siteNav");if(nav&&nav.classList.contains("open")&&!e.target.closest(".nav"))nav.classList.remove("open")});
