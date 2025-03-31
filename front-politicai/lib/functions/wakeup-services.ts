export function wakeUpServices() {
    fetch('https://caixinha-financeira-9a2031b303cc.herokuapp.com/')
        .finally(() => {
            console.log('Caixinha service is up');
        });

    fetch('https://communication-service-4f4f57e0a956.herokuapp.com/')
        .finally(() => {
            console.log('Communication service is up');
        });
}