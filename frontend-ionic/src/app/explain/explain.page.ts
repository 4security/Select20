import { Component, OnInit } from '@angular/core';
import { IonHeader, IonContent, IonButton, IonIcon } from '@ionic/angular/standalone';
import { FormsModule } from '@angular/forms';
import { HttpClientModule } from '@angular/common/http';
import { addIcons } from "ionicons";
import { arrowBack } from 'ionicons/icons';

@Component({
  selector: 'app-explain',
  templateUrl: './explain.page.html',
  styleUrls: ['./explain.page.scss'],
  providers: [Storage],
  imports: [IonHeader, IonContent, IonButton, FormsModule, IonIcon, HttpClientModule],
})
export class ExplainPage implements OnInit {

  constructor() {
    addIcons({ arrowBack });
  }

  ngOnInit() {
  }

}
