const form = document.querySelector('#contact-form');

if (form) {
    const phone = document.querySelector('#phone');

    phone.addEventListener('input', () => {
        const numbers = phone.value.replace(/\D/g, '').slice(0, 11);
        phone.value = numbers
            .replace(/^(\d{2})(\d)/g, '($1) $2')
            .replace(/(\d{5})(\d{4})$/, '$1-$2');
    });

    form.addEventListener('submit', (event) => {
        event.preventDefault();
        const fields = [
            { input: '#name', error: '#name-error', message: 'Informe seu nome.' },
            { input: '#email', error: '#email-error', message: 'Informe um e-mail válido.' },
            { input: '#message', error: '#message-error', message: 'Informe uma mensagem.' },
        ];
        let isValid = true;

        fields.forEach(({ input, error, message }) => {
            const field = document.querySelector(input);
            const errorElement = document.querySelector(error);
            const validEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(field.value);
            const valid = field.value.trim() && (field.type !== 'email' || validEmail);
            errorElement.textContent = valid ? '' : message;
            isValid = valid && isValid;
        });

        const feedback = document.querySelector('#form-feedback');
        feedback.textContent = isValid ? 'Mensagem enviada com sucesso!' : 'Revise os campos obrigatórios.';
        if (isValid) form.reset();
    });
}
