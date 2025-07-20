        // Menu clone
        const sections = document.querySelectorAll('section[id]');
        const menu = document.querySelector("#nav ul").cloneNode(true);
        const main = document.querySelector('#main');
        const index = document.createElement('nav');
        index.appendChild(menu);
        index.id = "index";
        main.prepend(index);
    
        // Injecte les liens rapides
        const quicklinks = document.querySelector("#quicklinks").cloneNode(true);
        quicklinks.id = "index-quicklinks";
        index.appendChild(quicklinks);
        
        // Mise à jour du premier lien (vers la première section, et non plus vers le sommaire)
        const firstLink = quicklinks.querySelector('a');
        firstLink.textContent = "↑";
        firstLink.href = "#" + document.querySelector('section[id]').id;
    
        // Menu mobile: insère un bouton pour afficher/masquer le menu
        const togglemenu = document.createElement('button');
        togglemenu.textContent = "☰";
        togglemenu.addEventListener('click', function(e) {
            e.stopPropagation();
            index.classList.toggle('visible');
        });
        index.prepend(togglemenu);
    
        index.addEventListener('click', function() {
            index.classList.remove('visible');
        });
    
        // Surligne le chapitre courant au scroll
        const observer = new IntersectionObserver(entries => {
            entries.forEach(entry => {
                const id = entry.target.getAttribute('id');
                if (entry.intersectionRatio > 0) {
                    const l = document.querySelector(`#index li a[href="#${id}"]`);
                    if (l) l.parentElement.classList.add('active');
                } else {
                    const li = document.querySelector(`#index li a[href="#${id}"]`);
                    if (li) li.parentElement.classList.remove('active');
                }
            });
        });
    
        // Observe chaque section
        sections.forEach((section) => {
            observer.observe(section);
        });
    
        const downloadlink = quicklinks.querySelector('a:last-child');
        downloadlink.onclick = () => {
            if (downloadlink.getAttribute('href') === "") {
                alert("Un fichier PDF doit être généré et téléversé dans le dossier. Le nom du fichier doit être configuré dans config.php. Documentation: https://esadpyrenees.github.io/PageTypeToPrint/print/");
            }
        };
    
        // Youtube and Vimeo light embeds
        document.querySelectorAll(':is(vimeo-embed, youtube-embed) button').forEach(button => button.addEventListener('click', () => {
            const video = button.previousElementSibling;
            video.src = video.dataset.src;
        }));
