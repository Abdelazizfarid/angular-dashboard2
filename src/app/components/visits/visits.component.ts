import { Component, TemplateRef, inject } from '@angular/core';
import { Storage, ref, uploadBytesResumable, getDownloadURL, deleteObject } from '@angular/fire/storage';
import { Firestore, collectionData, collection, Timestamp, doc, getDocs, query, where, getDocsFromServer, QueryConstraint, addDoc } from '@angular/fire/firestore';
import { Observable, Subject, Subscription } from 'rxjs';
import Swal from 'sweetalert2';
import { ApiService } from 'src/app/services/api.service';
import { ModalDismissReasons, NgbCalendar, NgbDate, NgbDateParserFormatter, NgbDateStruct, NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { Router } from '@angular/router';
import { AngularDeviceInformationService } from 'angular-device-information';
import { HttpClient } from '@angular/common/http';
import { DatePipe } from '@angular/common';
import { WebcamImage, WebcamInitError, WebcamUtil } from 'ngx-webcam';
import { AgmCoreModule, MapsAPILoader } from "@agm/core";

@Component({
  selector: 'app-visits',
  templateUrl: './visits.component.html',
  styleUrls: ['./visits.component.css']
})
export class VisitsComponent {
  // toggle webcam on/off
  public showWebcam = true;
  public allowCameraSwitch = false;
  public multipleWebcamsAvailable = false;
  public facingMode: string = 'environment';

  // latest snapshot
  public webcamImage: WebcamImage | any;

  // webcam snapshot trigger
  private trigger: Subject<void> = new Subject<void>();

  private storage: Storage = inject(Storage);
  private firestore: Firestore = inject(Firestore);

  uploadedImage: any

  visitsCollection: any

  getDeviceType: any
  getDeviceInfoOs: any
  getDeviceInfoOsVersion: any
  getDeviceInfoBrowser: any
  getDeviceInfoBrowserVersion: any
  getDeviceInfoScreen_resolution: any
  getDeviceInfoUserAgent: any
  latitude: any
  longitude: any
  customerLatitude: any
  customerLongitude: any
  customerAddress: any
  zoom: any
  address: any;

  currentAdded: any = []
  filteredCurrentAdded: any = []
  userData: any

  date: any
  time: any
  ampm: any

  constructor(public datepipe: DatePipe, private router: Router, private apiService: ApiService, private modalService: NgbModal, private deviceInformationService: AngularDeviceInformationService, private http: HttpClient) {
    this.getCurrentDeviceData()
    this.getDateTime()
    this.getUserData();
    this.getUserOwenVisits()
    this.setDateInNumbers()
  }

  ngOnInit(): void {
    this.readAvailableVideoInputs();
    this.getUserCustomers()
    this.getDropdownsData()
  }

  calculateDistance(lat1: any, lon1: any, lat2: any, lon2: any,) {
    const from = new google.maps.LatLng(lat1, lon1);
    const to = new google.maps.LatLng(lat2, lon2);
    const distance = google.maps.geometry.spherical.computeDistanceBetween(from, to);

    return distance
  }

  public triggerSnapshot(): void {
    this.trigger.next();
  }

  public handleInitError(error: WebcamInitError): void {
    if (error.mediaStreamError && error.mediaStreamError.name === 'NotAllowedError') {
    }
  }

  public handleImage(webcamImage: WebcamImage): void {
    this.webcamImage = webcamImage;
    this.uploadedImage = webcamImage.imageAsDataUrl
    this.uploadFile(webcamImage)
  }

  public get triggerObservable(): Observable<void> {
    return this.trigger.asObservable();
  }

  public get videoOptions(): MediaTrackConstraints {
    const result: MediaTrackConstraints = {};
    if (this.facingMode && this.facingMode !== '') {
      result.facingMode = { ideal: this.facingMode };
    }
    return result;
  }

  private readAvailableVideoInputs() {
    WebcamUtil.getAvailableVideoInputs()
      .then((mediaDevices: MediaDeviceInfo[]) => {
        this.multipleWebcamsAvailable = mediaDevices && mediaDevices.length > 1;
      });
  }

  subscription2: Subscription = new Subscription()
  allCustomers: any[] = []
  getUserCustomers() {
    let ref = collection(this.firestore, 'customersV2'),
      wa = [where('userId', '==', this.userData?.id)],
      refq2 = query(ref, ...wa);
    this.subscription2 = collectionData(refq2).subscribe((res: any) => {
      if (res?.length) {
        this.allCustomers = res
        this.allCustomers = this.allCustomers?.map((element: any) => {
          return {
            value: element,
            label: element?.name,
          }
        });
      } else {
        this.allCustomers = []
      }
      this.subscription2.unsubscribe()
    })
  }

  subscription3: Subscription = new Subscription()

  selectTypes: any = []
  selectClasses: any = []
  selectLines: any = []
  selectSpecialLine1: any = []
  selectSpecialLine2: any = []
  selectSpecialLine3: any = []
  selectDistLine1: any = []
  selectDistLine2: any = []
  selectDistLine3: any = []

  ausisSpecilty: any = []
  ausisTypes: any = []
  ausisClasses: any = []
  ausisDist: any = []
  getDropdownsData() {
    if (this.userData?.group == 'Ausis') {
      const itemCollection = collection(this.firestore, 'Ausis');
      this.subscription3 = collectionData(itemCollection).subscribe((res: any) => {
        this.selectLines = ['line4']
        this.ausisSpecilty = res[0]['speciality']
        this.ausisTypes = res[0]['type']
        this.ausisClasses = res[0]['classification']
        this.ausisDist = res[0]['distribution']
        this.subscription3.unsubscribe()
      })
    }
    if (this.userData?.group == 'Atos') {
      const itemCollection = collection(this.firestore, 'dropdown data');
      this.subscription3 = collectionData(itemCollection).subscribe((res: any) => {


        this.selectTypes = res[3]?.Type;
        this.selectClasses = res[4]?.classes;

        Object.keys(res[5]).forEach((k) => {
          this.selectLines?.push(res[5][k])
        })

        Object.keys(res[6]).forEach((k) => {
          switch (k) {
            case 'line1':
              this.selectSpecialLine1 = res[6][k]
              break;
            case 'line 2':
              this.selectSpecialLine2 = res[6][k]
              break;
            case 'line 3':
              this.selectSpecialLine3 = res[6][k]
              break;

            default:
              break;
          }
        })

        Object.keys(res[0]).forEach((k) => {
          switch (k) {
            case 'Dis. Name line 1':
              this.selectDistLine1 = res[0][k]
              break;
            case 'Dis. Name line2':
              this.selectDistLine2 = res[0][k]
              break;
            case 'Dis. Name line3':
              this.selectDistLine3 = res[0][k]
              break;
            default:
              break;
          }
        })

        this.subscription3.unsubscribe()
      })
    }
  }

  subscription4: Subscription = new Subscription()
  getUserOwenVisits() {
    let ref = collection(this.firestore, 'completed visits'),
      wa = [where('userId', '==', this.userData?.id)],
      refq2 = query(ref, ...wa);
    this.subscription4 = collectionData(refq2).subscribe((res: any) => {
      if (res?.length) {
        res?.sort((a: any, b: any) => (a?.completedTime?.seconds + (a?.completedTime?.nanoseconds / 1000000000)) - (b?.completedTime?.seconds + (b?.completedTime?.nanoseconds / 1000000000)));

        this.currentAdded = res
        this.filteredCurrentAdded = res
      } else {
        this.currentAdded = []
        this.filteredCurrentAdded = []
      }
      this.subscription4.unsubscribe()
    })
  }

  getUserData() {
    if (localStorage.getItem('userData')) {
      this.userData = JSON.parse(localStorage.getItem('userData') || '{}')
    }
  }

  getDateTime() {
    this.date = new Date().toDateString();
    this.ampm = new Date().getHours() >= 12 ? 'PM' : 'AM';
    this.time = new Date().getHours() + ':' + new Date().getMinutes() + ' ' + this.ampm;
  }

  startUpload: any
  uploadFile(image: any) {

    this.startUpload = true
    this.uploadedImage = null
    if (!image) {
      this.startUpload = false
      return;
    }
    if (this.latitude && this.longitude) {
      const file: any = this.DataURIToBlob(image?.imageAsDataUrl)
      const formData = new FormData();
      formData.append('upload', file, 'image.jpg')

      // const files: FileList = input.files;
      // for (let i = 0; i < files.length; i++) {
      //   const file = files.item(i);

      if (file) {
        const storageRef = ref(this.storage, 'images/' + this.generateName(10));
        uploadBytesResumable(storageRef, file).then(res => {
          getDownloadURL(res.ref).then((res) => {
            this.uploadedImage = res;
            this.startUpload = false
          });
        });
      }
      // }
    } else {
      Swal.fire({
        title: 'Add Visit Error',
        text: 'You must allow your location to add new visit!',
        icon: 'error'
      })
      this.startUpload = false
    }
  }

  DataURIToBlob(dataURI: string) {
    const splitDataURI = dataURI.split(',')
    const byteString = splitDataURI[0].indexOf('base64') >= 0 ? atob(splitDataURI[1]) : decodeURI(splitDataURI[1])
    const mimeString = splitDataURI[0].split(':')[1].split(';')[0]

    const ia = new Uint8Array(byteString.length)
    for (let i = 0; i < byteString.length; i++)
      ia[i] = byteString.charCodeAt(i)

    return new Blob([ia], { type: mimeString })
  }

  setDateInNumbers() {
    let y = new Date().getFullYear() > 10 ? new Date().getFullYear() : '0' + new Date().getFullYear(),
      m = +new Date().getMonth() + 1 > 10 ? +new Date().getMonth() + 1 : '0' + (+new Date().getMonth() + 1),
      d = new Date().getDate() > 10 ? new Date().getDate() : '0' + new Date().getDate();

    return d + '/' + m + '/' + y
  }

  startAdding: any
  addVisit(data: any) {
    this.startAdding = true

    if (!data) {
      this.startAdding = false
      return;
    }

    if (this.latitude && this.longitude) {
      if (this.calculateDistance(this.latitude, this.longitude, this.selectedCustomer?.lat, this.selectedCustomer?.lon) <= 200) {
        let currentAddedCollection = collection(this.firestore, 'completed visits')

        let Data = {
          address: this.selectedCustomer?.address,
          classy: this.selectedCustomer?.classy,
          completedDate: this.setDateInNumbers(),
          completedTime: new Date(),
          dateOfNextVisit: '',
          dateOfVisit: this.setCurrentDate(),
          dist: data?.dist,
          governorate: '',
          image: this.selectedCustomer?.image,
          isMocking: this.selectedCustomer?.isMocking,
          line: this.selectedCustomer?.line,
          name: this.selectedCustomer?.name,
          note: data?.note,
          phone: this.selectedCustomer?.phone,
          planed: false,
          searchName: this.selectedCustomer?.name,
          specialty: this.selectedCustomer?.specialty,
          status: false,
          time: this.setCurrentTime(),
          type: this.selectedCustomer?.type,
          userId: this.userData?.id,
          visitId: this.generateName(20),
        }

        addDoc(currentAddedCollection, Data).then((res: any) => {
          // this.currentAdded.push(Data)
          // this.currentAdded.splice(this.currentAdded?.length - 1, 0, Data);
          // this.filteredCurrentAdded.splice(this.filteredCurrentAdded?.length - 1, 0, Data);

          this.getUserOwenVisits()

          Swal.fire({
            title: 'visit added succesfully!',
            icon: 'success'
          })
          this.webcamImage = null
          this.uploadedImage = null
          this.startAdding = false
          this.modalService.dismissAll();
        }).catch((err) => {
          Swal.fire({
            title: 'visit added failed, please try again!',
            icon: 'error'
          })
          this.startAdding = false
          this.webcamImage = null
          this.uploadedImage = null
          this.modalService.dismissAll();
        });
      } else {
        Swal.fire({
          title: 'Add Visit Error',
          text: 'It must be within a distance of less than or equal to 200 metres to add new visit!',
          icon: 'error'
        })
        this.startAdding = false
      }
    } else {
      Swal.fire({
        title: 'Add Visit Error',
        text: 'You must allow your location to add new visit!',
        icon: 'error'
      })
      this.startAdding = false
    }
  }

  setCurrentDate(): any {
    return new Date().toLocaleDateString('en-us', { weekday: "short", year: "numeric", month: "short", day: "numeric" });
  }

  setCurrentTime(): any {
    let hour = new Date().getHours() > 10 ? new Date().getHours() : '0' + new Date().getHours(),
      min = new Date().getMinutes() > 10 ? new Date().getMinutes() : '0' + new Date().getMinutes(),
      sec = new Date().getSeconds() > 10 ? new Date().getSeconds() : '0' + new Date().getSeconds();
    return hour + ':' + min + ':' + sec;
  }

  generate(n: any): any {
    var add = 1, max = 12 - add;   // 12 is the min safe number Math.random() can generate without it starting to pad the end with zeros.

    if (n > max) {
      return this.generate(max) + this.generate(n - max);
    }

    max = Math.pow(10, n + add);
    var min = max / 10; // Math.pow(10, n) basically
    var number = Math.floor(Math.random() * (max - min + 1)) + min;

    return ("" + number).substring(add);
  }

  generateName(length: any) {
    let result = '';
    const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    const charactersLength = characters.length;
    let counter = 0;
    while (counter < length) {
      result += characters.charAt(Math.floor(Math.random() * charactersLength));
      counter += 1;
    }
    return result.toString() + '.jpg';
  }

  closeResult = '';
  selectedItem: any
  open(content: TemplateRef<any>, item?: any) {
    this.selectedItem = item
    this.modalService.open(content, { size: 'lg', centered: true }).result.then(
      (result: any) => {
        this.closeResult = `Closed with: ${result}`;
        this.selectedItem = ''
      },
      (reason: any) => {
        this.closeResult = `Dismissed ${this.getDismissReason(reason)}`;
        this.selectedItem = ''
      },
    );
  }

  private getDismissReason(reason: any): string {
    this.selectedItem = ''
    switch (reason) {
      case ModalDismissReasons.ESC:
        return 'by pressing ESC';
      case ModalDismissReasons.BACKDROP_CLICK:
        return 'by clicking on a backdrop';
      default:
        return `with: ${reason}`;
    }

  }

  getLocation(type?: any) {
    navigator.geolocation.getCurrentPosition((position) => {
      if (type == 'customer') {
        this.customerLatitude = position.coords.latitude;
        this.customerLongitude = position.coords.longitude;
        this.getAddress(this.customerLatitude, this.customerLongitude, 'customer')
      }
      this.latitude = position.coords.latitude;
      this.longitude = position.coords.longitude;
      this.zoom = 16;
      this.getAddress(this.latitude, this.longitude)
    });
  }

  getAddress(lat: any, lon: any, type?: any) {
    this.http.get(`https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${lat}4&lon=${lon}`).subscribe((data: any) => {
      if (type == 'customer') {
        this.customerAddress = data?.display_name
      }
      this.address = data?.display_name

    });
  }

  getCurrentDeviceData() {
    this.getDeviceType = this.deviceInformationService.getDeviceType()
    this.getDeviceInfoOs = this.deviceInformationService.getDeviceInfo().os
    this.getDeviceInfoOsVersion = this.deviceInformationService.getDeviceInfo().osVersion
    this.getDeviceInfoBrowser = this.deviceInformationService.getDeviceInfo().browser
    this.getDeviceInfoBrowserVersion = this.deviceInformationService.getDeviceInfo().browserVersion
    this.getDeviceInfoScreen_resolution = this.deviceInformationService.getDeviceInfo().screen_resolution
    this.getDeviceInfoUserAgent = this.deviceInformationService.getDeviceInfo().userAgent
  }

  exportElmToExcel(): void {
    const edata = [];
    const udt = {
      data: [
        { A: "Visits Details" }, // title
        {
          A: "Image",
          B: "Sales Person",
          C: "Customer Name",
          D: "Date Of Visit",
          E: "Time",
          F: "Address",
          G: "Governorate",
          H: "Phone",
          I: "Is Mocking",
          J: "Date Of Next Visit",
          K: "Sub Group",
          L: "Classification",
          M: "Distribution",
          N: "Specialty",
          O: "Type",
          P: "Line",
          Q: "Note",
        },
      ],
      skipHeader: true,
    };
    this.filteredCurrentAdded.forEach((data: any, i: any) => {
      udt.data.push({
        A: data?.image ? data?.image : '----',
        B: this.userData?.username ? this.userData?.username : '----',
        C: data?.searchName ? data?.searchName : '----',
        D: data?.dateOfVisit ? data?.dateOfVisit : '----',
        E: data?.time ? data?.time : '----',
        F: data?.address ? data?.address : '----',
        G: data?.governorate ? data?.governorate : '----',
        H: data?.phone ? data?.phone : '----',
        I: data?.isMocking,
        J: data?.dateOfNextVisit ? data?.dateOfNextVisit : '----',
        K: this.userData?.subgroup ? this.userData?.subgroup : '----',
        L: data?.classy ? data?.classy : '----',
        M: data?.dist ? data?.dist : '----',
        N: data?.specialty ? data?.specialty : '----',
        O: data?.type ? data?.type : '----',
        P: data?.line ? data?.line : '----',
        Q: data?.note ? data?.note : '----',
      });
    });
    edata.push(udt);

    const DateObj = new Date();
    const dateNow =
      DateObj.getFullYear() +
      "-" +
      ("0" + (DateObj.getMonth() + 1)).slice(-2) +
      "-" +
      ("0" + DateObj.getDate()).slice(-2);
    this.apiService.exportJsonToExcel(edata, "visits_details_" + dateNow);
  }

  // // Create a reference to the file to delete
  // const desertRef = ref(storage, 'images/desert.jpg');
  // // Delete the file
  // deleteObject(desertRef).then(() => {
  //   // File deleted successfully
  // }).catch ((error) => {
  //   // Uh-oh, an error occurred!
  // });
  selectedCustomer: any
  setCustermorData(event: any) {
    if (event?.value) {
      this.selectedCustomer = event?.value;
    } else {
      this.selectedCustomer = null
    }
  }

  startAddCustomer: any
  addCustomer(data: any) {
    if (this.customerLatitude && this.customerLongitude) {
      let customerCollection = collection(this.firestore, 'customersV2')

      this.startAddCustomer = true
      let CustomerData = {
        address: this.customerAddress,
        classy: data?.class,
        date: this.date,
        dist: '',
        image: this.uploadedImage,
        isMocking: false,
        lat: this.customerLatitude,
        line: data?.line,
        lon: this.customerLongitude,
        name: data?.name,
        note: '',
        phone: data?.phone,
        searchName: data?.name,
        specialty: data?.specialty,
        states: false,
        time: this.time,
        type: data?.type,
        userId: this.userData?.id
      }

      addDoc(customerCollection, CustomerData).then((res: any) => {
        Swal.fire({
          title: 'Customer added succesfully!',
          icon: 'success'
        })
        this.getUserCustomers()
        this.webcamImage = null
        this.uploadedImage = null
        this.startAddCustomer = false
        this.modalService.dismissAll();
      }).catch((err) => {
        Swal.fire({
          title: 'Customer added failed, please try again!',
          icon: 'error'
        })
        this.startAddCustomer = false
        this.webcamImage = null
        this.uploadedImage = null
        this.modalService.dismissAll();
      });
    } else {
      Swal.fire({
        title: 'Add Customer Error',
        text: 'You must allow your location to add new Customer!',
        icon: 'error'
      })
      this.startAddCustomer = false
    }
  }

  filterTypeValue: any
  resetFilter() {
    this.filterTypeValue = 0
    this.filteredCurrentAdded = this.currentAdded;
    this.fromDate = null
    this.toDate = null
  }

  applyFilter(event: any, type: any, select?: any) {
    let filterValue = ''
    if (select) {
      filterValue = event;
    } else {
      filterValue = (event?.target as HTMLInputElement)?.value;
    }

    if (!filterValue) {
      //empty filter, show all countries:
      this.filteredCurrentAdded = this.currentAdded;
    } else {

      if (type == 'Line') {
        this.filteredCurrentAdded = this.currentAdded.filter(
          (obj: any) => obj?.line?.toLowerCase().includes(filterValue.trim().toLowerCase())
        );
      }

      if (type == 'Class') {
        this.filteredCurrentAdded = this.currentAdded.filter(
          (obj: any) => obj?.classy?.toLowerCase().includes(filterValue.trim().toLowerCase())
        );
      }

      if (type == 'Specialty') {
        this.filteredCurrentAdded = this.currentAdded.filter(
          (obj: any) => obj?.specialty?.toLowerCase().includes(filterValue.trim().toLowerCase())
        );
      }

      if (type == 'Type') {
        this.filteredCurrentAdded = this.currentAdded.filter(
          (obj: any) => obj?.type?.toLowerCase().includes(filterValue.trim().toLowerCase())
        );
      }


    }
  }

  calendar = inject(NgbCalendar);
  formatter = inject(NgbDateParserFormatter);

  hoveredDate: NgbDate | null = null;
  fromDate!: NgbDate | null
  toDate!: NgbDate | null
  maxDate = { year: new Date().getFullYear(), month: new Date().getUTCMonth() + 1, day: new Date().getDate() }

  equals = (one: NgbDateStruct, two: NgbDateStruct) =>
    one && two && two.year === one.year && two.month === one.month && two.day === one.day;

  onDateSelection(date: NgbDate) {
    if (!this.fromDate && !this.toDate) {
      this.fromDate = date;
    } else if (this.fromDate && !this.toDate && this.equals(date, this.fromDate)) {
      this.toDate = this.fromDate;
    } else if (this.fromDate && !this.toDate && date && date.after(this.fromDate)) {
      this.toDate = date;
    } else {
      this.toDate = null;
      this.fromDate = date;
    }

    if (this.fromDate && this.toDate) {
      this.filteredCurrentAdded = this.currentAdded.filter(
        (obj: any) => this.checkDate(obj?.completedDate));
    }
  }

  isHovered(date: NgbDate) {
    return (
      this.fromDate && !this.toDate && this.hoveredDate && date.after(this.fromDate) && date.before(this.hoveredDate)
    );
  }

  isInside(date: NgbDate) {

    return this.toDate && date.after(this.fromDate) && date.before(this.toDate);
  }

  isRange(date: NgbDate) {
    return (
      date.equals(this.fromDate) ||
      (this.toDate && date.equals(this.toDate)) ||
      this.isInside(date) ||
      this.isHovered(date)
    );
  }

  validateInput(currentValue: NgbDate | null, input: string): NgbDate | null {
    const parsed = this.formatter.parse(input);
    return parsed && this.calendar.isValid(NgbDate.from(parsed)) ? NgbDate.from(parsed) : currentValue;
  }

  checkDate(date: any): any {
    if (this.fromDate && this.toDate) {
      let visitDate = date?.split('/')

      const start = Date.parse(this.fromDate?.month + '/' + this.fromDate?.day + '/' + this.fromDate?.year);
      const end = Date.parse(this.toDate?.month + '/' + this.toDate?.day + '/' + this.toDate?.year);
      const d = Date.parse(visitDate[1] + '/' + visitDate[0] + '/' + visitDate[2]);
      return d >= start && d <= end
    }
  }
}

