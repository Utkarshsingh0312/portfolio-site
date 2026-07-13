        document.getElementById('startBtn').addEventListener('click', function() {
            document.body.classList.add('fade-out');
            setTimeout(function() {
                window.location.href = 'http://127.0.0.1:3000/portfolio-site/portfolio/index.html'; 
            }, 800); 
        });