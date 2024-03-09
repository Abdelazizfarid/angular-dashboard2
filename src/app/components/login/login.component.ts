import { Component, inject } from '@angular/core';
import { Firestore, collectionData, collection, Timestamp, doc, getDocs, query, where, getDocsFromServer, QueryConstraint, addDoc } from '@angular/fire/firestore';
import { FormGroup, FormControl, FormBuilder, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { icon } from 'leaflet';
import { Observable, Subscription } from 'rxjs';
import { ApiService } from 'src/app/services/api.service';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css']
})

export class LoginComponent {
  firestore: Firestore = inject(Firestore);

  loginForm: FormGroup | any;
  username: FormControl | any;
  password: FormControl | any;

  subscription: Subscription = new Subscription()
  subscription2: Subscription = new Subscription()

  logging: boolean = false

  users: any
  constructor(private fb: FormBuilder, private apiService: ApiService, private router: Router) {
  }

  ngOnInit(): void {
    this.initForm();
  }

  sub!: Subscription;
  initForm() {
    this.loginForm = this.fb.group({
      username: new FormControl('', [Validators.required, Validators.minLength(4),]),
      password: new FormControl('', [Validators.required, Validators.minLength(4), Validators.maxLength(32)]),
    })
  }

  get LoginFormControls() {
    return this.loginForm.controls
  }

  login() {
    if (this.loginForm.valid) {
      let userData: any = ''
      let ref = collection(this.firestore, 'usersV2')
      let wa: QueryConstraint[] = [
        where('username', '==', this.loginForm.controls.username.value),
        where('password', '==', this.loginForm.controls.password.value)]

      const refq = query(ref, ...wa)

      let ref2 = collection(this.firestore, 'allawed_users')
      let wa2: QueryConstraint[];
      let refq2: any;

      this.subscription = collectionData(refq).subscribe((data: any) => {
        if (data?.length) {
          // check Allowed Or Not
          wa2 = [where('userId', '==', data[0].id)]
          refq2 = query(ref2, ...wa2)
          this.subscription2 = collectionData(refq2).subscribe((res: any) => {
            if (res?.length) {
              userData = data[0];
              localStorage.setItem('userData', JSON.stringify(userData))

              Swal.fire({
                title: 'Login',
                text: 'User Login Successfully!',
                icon: 'success'
              }).then(() => {
                this.router.navigate(['/visits'])
              })
            } else {
              Swal.fire({
                title: 'Login',
                text: 'User Name Or Password Is Wrong , Or You Are Not Allowed To Login!',
                icon: 'error'
              })
            }
            this.subscription2.unsubscribe()
          })
          this.subscription.unsubscribe()
        } else {
          Swal.fire({
            title: 'Login',
            text: 'User Name Or Password Is Wrong , Or You Are Not Allowed To Login!',
            icon: 'error'
          })
        }
      })
    } else {
      Swal.fire({
        title: 'Login',
        text: 'User Name Or Password Is Wrong',
        icon: 'error'
      })
    }
  }

  ngOnDestroy(): void {
    this.subscription.unsubscribe()
    this.subscription2.unsubscribe()
  }
}
