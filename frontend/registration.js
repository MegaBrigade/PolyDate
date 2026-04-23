

document.addEventListener('DOMContentLoaded', () => {
    
    const screens = document.querySelectorAll('.screen');
    if (screens.length === 0) return;

    let currentIndex = 0;

    
    screens[currentIndex].classList.add('active');

    
    const nextButtons = document.querySelectorAll('.next-btn');

    nextButtons.forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.preventDefault(); 

            
            screens[currentIndex].classList.remove('active');

            
            currentIndex++;

            if (currentIndex < screens.length) {
                screens[currentIndex].classList.add('active');
                
                window.scrollTo({ top: 0, behavior: 'smooth' });
            } else {
                
                alert('Регистрация завершена!');
                
                
            }
        });
    });
});

document.querySelectorAll('.gender-option').forEach(option => {
    option.addEventListener('click', () => {
        
        document.querySelectorAll('.gender-option').forEach(opt => opt.classList.remove('active'));
        
        option.classList.add('active');
        
        const gender = option.getAttribute('data-gender');
        console.log('Выбран пол:', gender);
    });
});

const tagItems = document.querySelectorAll('.tag-item');
let selectedTags = [];

tagItems.forEach(tag => {
    tag.addEventListener('click', () => {
        const tagValue = tag.getAttribute('data-tag');
        
        if (tag.classList.contains('active')) {
            tag.classList.remove('active');
            selectedTags = selectedTags.filter(t => t !== tagValue);
        } else {
            if (selectedTags.length >= 5) {
                alert('Можно выбрать не более 5 тегов');
                return;
            }
            tag.classList.add('active');
            selectedTags.push(tagValue);
        }
        console.log('Выбрано:', selectedTags);
    });
});