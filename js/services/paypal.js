// ===== PAYPAL SERVICE =====
// Handles PayPal payments for donations (<10€) and monthly subscriptions (1.25€/mois)
const PayPalService = {
    // Set from env or hardcode your PayPal Client ID here
    // TODO: Replace with your actual PayPal Client ID
    CLIENT_ID: 'AdtpwwD0vAoyAUsgIZ6oVEiVkQLWFrC9DX5EzPZxFrHod0f6V9nN9K2OTynkmYV0vi_3Qiio6CY4X9ia',

    // PayPal Billing Plan ID for monthly subscription (created in PayPal Dashboard)
    // TODO: Replace with your actual Plan ID
    PLAN_ID: '',

    _sdkLoaded: false,

    // Load PayPal JS SDK dynamically
    async loadSDK() {
        if (this._sdkLoaded || typeof paypal !== 'undefined') {
            this._sdkLoaded = true;
            return true;
        }

        if (!this.CLIENT_ID) {
            return false;
        }

        return new Promise((resolve) => {
            const script = document.createElement('script');
            script.src = `https://www.paypal.com/sdk/js?client-id=${this.CLIENT_ID}&currency=EUR&intent=capture&components=buttons`;
            script.onload = () => {
                this._sdkLoaded = true;
                resolve(true);
            };
            script.onerror = () => {
                resolve(false);
            };
            document.head.appendChild(script);
        });
    },

    // Render PayPal donate button in a container
    async renderDonateButton(containerId, getAmount) {
        const loaded = await this.loadSDK();
        if (!loaded || typeof paypal === 'undefined') return;

        const container = document.getElementById(containerId);
        if (!container) return;
        container.innerHTML = '';

        paypal.Buttons({
            style: {
                layout: 'horizontal',
                color: 'gold',
                shape: 'pill',
                label: 'donate',
                height: 40,
                tagline: false
            },

            createOrder: async () => {
                const amount = typeof getAmount === 'function' ? getAmount() : getAmount;
                if (!amount || amount < 0.50) {
                    App.showToast('Montant minimum : 0.50€');
                    throw new Error('Amount too low');
                }

                try {
                    const res = await fetch('/.netlify/functions/create-paypal-order', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            mode: 'donation',
                            amount: amount,
                            userId: AuthService.isLoggedIn() ? AuthService.getCurrentUser().uid : Storage._get('device_id', '')
                        })
                    });
                    const data = await res.json();
                    if (data.error) throw new Error(data.error);
                    return data.orderId;
                } catch (e) {
                    App.showToast('Erreur PayPal — réessaie');
                    throw e;
                }
            },

            onApprove: async (data) => {
                try {
                    const res = await fetch('/.netlify/functions/capture-paypal-order', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            orderId: data.orderID,
                            userId: AuthService.isLoggedIn() ? AuthService.getCurrentUser().uid : Storage._get('device_id', '')
                        })
                    });
                    const result = await res.json();
                    if (result.status === 'COMPLETED') {
                        Modal.close();
                        if (typeof Modal !== 'undefined') {
                            Modal.show(`
                                <div style="text-align:center">
                                    <div style="font-size:56px;margin-bottom:12px">💝</div>
                                    <h3 style="margin-bottom:8px">Merci infiniment !</h3>
                                    <p style="color:var(--text-secondary);font-size:14px;line-height:1.5;margin-bottom:16px">
                                        Ton soutien via PayPal aide à faire grandir IronFuel.<br>
                                        Chaque don compte, merci d'y croire ! 🙏
                                    </p>
                                    <button class="btn btn-primary" onclick="Modal.close()" style="width:100%">Fermer</button>
                                </div>
                            `);
                        } else {
                            App.showToast('Merci pour ton soutien ! ❤️');
                        }
                    } else {
                        throw new Error('Capture failed');
                    }
                } catch (e) {
                    App.showToast('Erreur lors de la capture du paiement');
                }
            },

            onCancel: () => {
                App.showToast('Paiement annulé');
            },

            onError: (err) => {
                App.showToast('Erreur PayPal');
            }
        }).render('#' + containerId);
    },

    // Render PayPal subscribe button (monthly 1.25€)
    async renderSubscribeButton(containerId) {
        const loaded = await this.loadSDK();
        if (!loaded || typeof paypal === 'undefined') return;

        if (!this.PLAN_ID) {
            return;
        }

        const container = document.getElementById(containerId);
        if (!container) return;
        container.innerHTML = '';

        paypal.Buttons({
            style: {
                layout: 'horizontal',
                color: 'blue',
                shape: 'pill',
                label: 'subscribe',
                height: 40,
                tagline: false
            },

            createSubscription: async (data, actions) => {
                return actions.subscription.create({
                    plan_id: this.PLAN_ID,
                    custom_id: AuthService.isLoggedIn() ? AuthService.getCurrentUser().uid : Storage._get('device_id', ''),
                    application_context: {
                        brand_name: 'IronFuel',
                        locale: 'fr-FR',
                        user_action: 'SUBSCRIBE_NOW'
                    }
                });
            },

            onApprove: async (data) => {
                // Unlock premium
                const trialData = TrialService._getData();
                trialData.paid = true;
                trialData.paidDate = new Date().toISOString();
                trialData.paymentId = data.subscriptionID;
                trialData.plan = 'monthly';
                trialData.provider = 'paypal';
                TrialService._setData(trialData);

                Modal.close();
                App.showToast('Abonnement PayPal activé ! 🎉');

                // Save to Firestore via webhook (PayPal will call our webhook)
                // Also notify server
                try {
                    await fetch('/.netlify/functions/capture-paypal-order', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            subscriptionId: data.subscriptionID,
                            userId: AuthService.isLoggedIn() ? AuthService.getCurrentUser().uid : Storage._get('device_id', ''),
                            type: 'subscription',
                            plan: 'monthly'
                        })
                    });
                } catch (e) {
                }

                App.navigate('dashboard');
            },

            onCancel: () => {
                App.showToast('Abonnement annulé');
            },

            onError: (err) => {
                App.showToast('Erreur PayPal');
            }
        }).render('#' + containerId);
    },

    // Quick check if PayPal is configured
    isConfigured() {
        return !!(this.CLIENT_ID && this.CLIENT_ID.length > 10);
    }
};
