<template>
	<ion-page>
		<ion-header :translucent="true">
			<ion-toolbar>
				<ion-title class="ion-text-center">Perfil</ion-title>
			</ion-toolbar>
		</ion-header>

		<ion-content :fullscreen="true" class="profile-content">
			<section>
				<ion-card class="profile-card">
					<ion-card-content class="profile-header">
						<ion-avatar class="profile-avatar">
							<span>{{ user.initials }}</span>
						</ion-avatar>
						<h2 class="profile-name">{{ user.fullName }}</h2>
					</ion-card-content>
				</ion-card>
			</section>

			<section>
				<ion-card class="contact-card">
					<ion-card-header>
						<ion-card-title>Información de contacto</ion-card-title>
					</ion-card-header>
					<ion-card-content>
						<ion-list inset>
							<ion-item>
								<ion-icon slot="start" :icon="mailOutline" aria-hidden="true"></ion-icon>
								<ion-label>
									<h3>Correo</h3>
									<p>{{ user.email }}</p>
								</ion-label>
							</ion-item>
							<ion-item>
								<ion-icon slot="start" :icon="callOutline" aria-hidden="true"></ion-icon>
								<ion-label>
									<h3>Teléfono</h3>
									<p>{{ user.phone }}</p>
								</ion-label>
							</ion-item>
							<ion-item>
								<ion-icon slot="start" :icon="locationOutline" aria-hidden="true" />
								<ion-label>
									<h3>Ubicación</h3>
									<p>{{ user.location }}</p>
								</ion-label>
							</ion-item>
						</ion-list>
					</ion-card-content>
				</ion-card>

				<div class="logout-wrapper">
					<ion-button class="logout-button" @click="redirectToLogin">
						Cerrar sesión
					</ion-button>
				</div>
			</section>
            <section>
                <ion-chip class="safe-area-spacer" aria-hidden="true" disabled>
					Espacio reservado
				</ion-chip>
            </section>
            <section>
                <ion-chip class="safe-area-spacer" aria-hidden="true" disabled>
					Espacio reservado
				</ion-chip>
            </section>
            <section>
                <ion-chip class="safe-area-spacer" aria-hidden="true" disabled>
					Espacio reservado
				</ion-chip>
            </section>
		</ion-content>
	</ion-page>
</template>

<script setup lang="ts">
import {
	IonAvatar,
	IonButton,
	IonCard,
	IonCardContent,
	IonCardHeader,
	IonCardTitle,
	IonContent,
	IonHeader,
	IonIcon,
	IonItem,
	IonChip,
	IonLabel,
	IonList,
	IonPage,
	IonTitle,
	IonToolbar,
} from '@ionic/vue';
import { callOutline, locationOutline, mailOutline } from 'ionicons/icons';
import { useRouter } from 'vue-router';

const user = {
	initials: 'FM',
	fullName: 'Fabian Matus',
	email: 'fabian.matus@example.com',
	phone: '+56 9 5555 1234',
	location: 'Edificio Central, Nivel 3',
};


const router = useRouter();

const redirectToLogin = () => {
	router.push({ name: 'Login' });
};

</script>

<style scoped>
.profile-content {
	--background: var(--ion-color-light, #f5f5f5);
	padding: 20px 16px 32px;
	display: flex;
	flex-direction: column;
	gap: 24px;
}

.profile-card,
.contact-card {
	border-radius: 18px;
	box-shadow: 0 12px 24px -12px rgba(15, 23, 42, 0.35);
}

.profile-header {
	display: flex;
	flex-direction: column;
	align-items: center;
	gap: 16px;
	text-align: center;
}

.profile-avatar {
	width: 96px;
	height: 96px;
	background: var(--ion-color-primary, #2eae78);
	color: #fff;
	display: flex;
	align-items: center;
	justify-content: center;
	font-size: 2.1rem;
	font-weight: 600;
	text-transform: uppercase;
}

.profile-name {
	margin: 0;
	font-size: 1.4rem;
	font-weight: 650;
}

.contact-card ion-card-title {
	font-size: 1.1rem;
	font-weight: 600;
}

.contact-card ion-item h3 {
	margin: 0;
	font-size: 0.9rem;
	text-transform: uppercase;
	color: var(--ion-color-medium, #6b7280);
}

.contact-card ion-item p {
	margin: 4px 0 0;
	font-size: 1rem;
	color: #0f172a;
}

.contact-card ion-icon {
	font-size: 1.4rem;
	color: var(--ion-color-primary, #2eae78);
}

.logout-button {
	margin-top: 12px;
	border-radius: 12px;
	width: 100%;
	--background: #f84857;
	--background-focused: #e53c4a;
	--background-activated: #d43343;
	--color: #ffffff;
	box-shadow: 0 10px 24px -12px rgba(248, 72, 87, 0.65);
}

.logout-wrapper {
	max-width: 385px;
	margin: 0 auto;
}

.safe-area-spacer {
	opacity: 0;
	width: 100%;
	min-height: 0;
	margin: 0;
	padding: 0;
}

:global(.has-mobile-navbar) .safe-area-spacer {
	min-height: calc(env(safe-area-inset-bottom, 0) + 5rem);
}

@media (max-width: 480px) {
	.profile-avatar {
		width: 120px;
		height: 120px;
		font-size: 2.25rem;
	}

	.profile-name {
		font-size: 1.25rem;
	}
}
</style>
