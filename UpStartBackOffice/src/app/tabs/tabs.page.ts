import { Component } from '@angular/core';
import { IonTabs, IonTabBar, IonTabButton, IonIcon, IonLabel } from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import {
  speedometerOutline,
  speedometer,
  stopwatchOutline,
  stopwatch,
  peopleOutline,
  people,
  documentTextOutline,
  documentText,
  personCircleOutline,
  personCircle,
} from 'ionicons/icons';

@Component({
  selector: 'app-tabs',
  templateUrl: 'tabs.page.html',
  styleUrls: ['tabs.page.scss'],
  imports: [IonTabs, IonTabBar, IonTabButton, IonIcon, IonLabel],
})
export class TabsPage {
  constructor() {
    addIcons({
      speedometerOutline,
      speedometer,
      stopwatchOutline,
      stopwatch,
      peopleOutline,
      people,
      documentTextOutline,
      documentText,
      personCircleOutline,
      personCircle,
    });
  }
}
