import { Component, OnInit, OnDestroy } from '@angular/core';
import { FormBuilder, FormGroup, Validators, AbstractControl, ValidationErrors } from '@angular/forms';
import { EmployeeService } from '../../shared/services/employee.service';
import { AuthService } from '../../shared/services/auth.service';
import { TranslationService } from '../../shared/services/translation.service';
import { IdGeneratorService } from '../../shared/services/id-generator.service';
import { Router } from '@angular/router';
import { IEmployee, IPosition } from '../../shared/interfaces/employee.interface';

import { ModalService } from '../../shared/services/modal.service';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { Subscription } from 'rxjs';

@UntilDestroy()
@Component({
    selector: 'app-admin-dashboard',
    templateUrl: './admin-dashboard.component.html',
    styleUrls: ['./admin-dashboard.component.scss']
})
export class AdminDashboardComponent implements OnInit, OnDestroy {
    employees: IEmployee[] = [];
    positions: IPosition[] = [];
    selectedEmployee: IEmployee | null = null;
    isEditing = false;

    showEmployeeForm = false;
    showPositionForm = false;
    showMainInterface = true;

    employeeForm: FormGroup;
    positionForm: FormGroup;

    newPositionName = '';
    errorMessage = '';
    isLoading = false;
    translationsLoaded = false;

    private readonly phonePattern = /^(\d{6}|\+\d{1,3}\(\d{1,4}\)\d{7})$/;
    private readonly namePattern = /^[a-zA-Zа-яА-ЯёЁ\s\-]+$/;

    private translationsSubscription: Subscription;

    constructor(
        private employeeService: EmployeeService,
        private authService: AuthService,
        public translationService: TranslationService,
        private idGenerator: IdGeneratorService,
        private router: Router,
        private modalService: ModalService,
        private fb: FormBuilder
    ) {
        this.employeeForm = this.fb.group({
            first_name: ['', [
                Validators.required, 
                Validators.minLength(2),
                Validators.maxLength(50),
                this.nameValidator.bind(this)
            ]],
            last_name: ['', [
                Validators.required, 
                Validators.minLength(2),
                Validators.maxLength(50),
                this.nameValidator.bind(this)
            ]],
            middle_name: ['', [
                Validators.maxLength(50),
                this.nameValidator.bind(this)
            ]],
            position_id: ['', Validators.required],
            address: ['', Validators.maxLength(200)],
            contact_email: ['', [Validators.required, Validators.email]],
            contact_phone: ['', [
                Validators.required,
                this.phoneValidator.bind(this)
            ]],
            salary: [0, [
                Validators.required, 
                Validators.min(0),
                Validators.max(1000000)
            ]]
        });

        this.positionForm = this.fb.group({
            name: ['', [
                Validators.required, 
                Validators.minLength(2),
                Validators.maxLength(50),
                this.nameValidator.bind(this)
            ]]
        });

        this.translationsSubscription = this.translationService.getTranslationsLoadedObservable()
            .subscribe(loaded => {
                this.translationsLoaded = loaded;
                if (loaded) {
                    console.log('Translations loaded in admin dashboard');
                }
            });
    }

    public ngOnInit(): void {
        if (!this.authService.validateToken()) {
            this.router.navigate(['/login']);
            return;
        }

        this.loadEmployees();
        this.loadPositions();
    }

    public ngOnDestroy(): void {
        if (this.translationsSubscription) {
            this.translationsSubscription.unsubscribe();
        }
    }

    private phoneValidator(control: AbstractControl): ValidationErrors | null {
        if (!control.value) {
            return null;
        }

        const value = control.value.toString().trim();
        
        if (!this.phonePattern.test(value)) {
            return { phoneFormat: true };
        }

        if (value.includes('+')) {
            const countryCodeMatch = value.match(/^\+\d{1,3}/);
            if (!countryCodeMatch) {
                return { phoneFormat: true };
            }

            const countryCode = countryCodeMatch[0];
            const restOfNumber = value.slice(countryCode.length);
            
            const restPattern = /^\(\d{1,4}\)\d{7}$/;
            if (!restPattern.test(restOfNumber)) {
                return { phoneFormat: true };
            }

            if (countryCode === '+375') {
                const operatorCode = restOfNumber.match(/\((\d{2})\)/);
                if (!operatorCode || operatorCode[1].length !== 2) {
                    return { phoneFormat: true };
                }
            } else if (countryCode === '+7') {
                const regionCode = restOfNumber.match(/\((\d{3})\)/);
                if (!regionCode || regionCode[1].length !== 3) {
                    return { phoneFormat: true };
                }
            } else {
                const operatorCode = restOfNumber.match(/\((\d+)\)/);
                if (!operatorCode || operatorCode[1].length < 1 || operatorCode[1].length > 4) {
                    return { phoneFormat: true };
                }
            }
        } else {
            if (!/^\d{6}$/.test(value)) {
                return { phoneFormat: true };
            }
        }

        return null;
    }

    private nameValidator(control: AbstractControl): ValidationErrors | null {
        if (!control.value) {
            return null;
        }

        const value = control.value.toString().trim();
        
        if (!this.namePattern.test(value)) {
            return { invalidName: true };
        }

        return null;
    }

    public loadEmployees(): void {
        this.isLoading = true;
        this.employeeService.getEmployees().pipe(untilDestroyed(this)).subscribe({
            next: (employees) => {
                this.employees = employees;
                this.isLoading = false;
            },
            error: (error) => {
                console.error(this.translationService.translate('CONSOLE.ERROR_LOADING_EMPLOYEES'), error);
                this.errorMessage = error.message;
                this.isLoading = false;

                if (error.message.includes(this.translationService.translate('ADMIN.UNAUTHORIZED_ERROR'))) {
                    this.router.navigate(['/login']);
                }
            }
        });
    }

    public loadPositions(): void {
        this.employeeService.getPositions().pipe(untilDestroyed(this)).subscribe({
            next: (positions) => {
                this.positions = positions;
            },
            error: (error) => {
                console.error(this.translationService.translate('CONSOLE.ERROR_LOADING_POSITIONS'), error);
                this.errorMessage = error.message;

                if (error.message.includes(this.translationService.translate('ADMIN.UNAUTHORIZED_ERROR'))) {
                    this.router.navigate(['/login']);
                }
            }
        });
    }

    public showAddEmployeeForm(): void {
        this.showMainInterface = false;
        this.showEmployeeForm = true;
        this.showPositionForm = false;

        this.employeeForm.reset({
            first_name: '',
            last_name: '',
            middle_name: '',
            position_id: this.positions.length > 0 ? this.positions[0].id! : '',
            address: '',
            contact_email: '',
            contact_phone: '',
            salary: 0
        });
        
        this.selectedEmployee = null;
        this.isEditing = false;
        this.errorMessage = '';
    }

    public showAddPositionForm(): void {
        this.showMainInterface = false;
        this.showPositionForm = true;
        this.showEmployeeForm = false;
        this.positionForm.reset({ name: '' });
        this.errorMessage = '';
    }

    public cancelForm(): void {
        this.showMainInterface = true;
        this.showEmployeeForm = false;
        this.showPositionForm = false;
        this.selectedEmployee = null;
        this.errorMessage = '';
        this.employeeForm.reset();
        this.positionForm.reset();
    }

    public createEmployee(): void {
        if (!this.authService.validateToken()) {
            this.router.navigate(['/login']);
            return;
        }

        this.showAddEmployeeForm();
    }

    public editEmployee(employee: IEmployee): void {
        this.selectedEmployee = { ...employee };
        this.isEditing = true;
        this.showEmployeeForm = true;
        this.showMainInterface = false;
        this.showPositionForm = false;

        this.employeeForm.patchValue({
            first_name: employee.first_name,
            last_name: employee.last_name,
            middle_name: employee.middle_name || '',
            position_id: employee.position_id,
            address: employee.address || '',
            contact_email: employee.contact_email,
            contact_phone: employee.contact_phone,
            salary: employee.salary
        });
    }

    public deleteEmployee(id: number): void {
        const employee = this.employees.find(emp => emp.id === id);
        if (!employee) return;

        const message = `<strong>${this.translationService.translate('ADMIN.EMPLOYEE_DELETE_CONFIRM_MESSAGE')}</strong>
    <br><br>
    <strong>${this.translationService.translate('ADMIN.EMPLOYEE_ID')}</strong> ${employee.employee_id}<br>
    <strong>${this.translationService.translate('ADMIN.EMPLOYEE_FULL_NAME')}</strong> ${employee.last_name} ${employee.first_name} ${employee.middle_name || ''}<br>
    <strong>${this.translationService.translate('ADMIN.EMPLOYEE_POSITION')}</strong> ${employee.position_name}
  `;

        this.modalService.showConfirm(
            this.translationService.translate('ADMIN.EMPLOYEE_DELETE_CONFIRM_TITLE'), 
            message, 
            this.translationService.translate('ACTIONS.DELETE'), 
            this.translationService.translate('ACTIONS.CANCEL')
        )
            .pipe(untilDestroyed(this))
            .subscribe(confirmed => {
                if (confirmed) {
                    this.employeeService.deleteEmployee(id).pipe(untilDestroyed(this)).subscribe({
                        next: () => {
                            this.loadEmployees();
                            this.errorMessage = '';
                        },
                        error: (error) => {
                            console.error(this.translationService.translate('CONSOLE.ERROR_DELETING_EMPLOYEE'), error);
                            this.errorMessage = error.message;
                        }
                    });
                }
            });
    }

    public saveEmployee(): void {
        if (!this.authService.validateToken()) {
            this.router.navigate(['/login']);
            return;
        }

        if (this.employeeForm.invalid) {
            this.markFormGroupTouched(this.employeeForm);
            return;
        }

        const formValue = this.employeeForm.value;
        
        const employee: IEmployee = {
            ...formValue,
            employee_id: this.isEditing && this.selectedEmployee 
                ? this.selectedEmployee.employee_id 
                : this.idGenerator.generateEmployeeId(
                    formValue.first_name,
                    formValue.last_name,
                    formValue.middle_name
                ),
            id: this.isEditing && this.selectedEmployee ? this.selectedEmployee.id : undefined
        };

        this.isLoading = true;

        if (this.isEditing && employee.id) {
            this.employeeService.updateEmployee(employee.id, employee)
                .pipe(untilDestroyed(this)).subscribe({
                next: () => {
                    this.loadEmployees();
                    this.showEmployeeForm = false;
                    this.showMainInterface = true;
                    this.errorMessage = '';
                    this.isLoading = false;
                    this.modalService.showAlert(
                        `${this.translationService.translate('SUCCESS.MESSAGE')}`, 
                        this.translationService.translate('ADMIN.EMPLOYEE_UPDATED_SUCCESS')
                    )
                        .pipe(untilDestroyed(this)).subscribe();
                },
                error: (error) => {
                    console.error(this.translationService.translate('CONSOLE.ERROR_UPDATING_EMPLOYEE'), error);
                    this.errorMessage = error.message;
                    this.isLoading = false;
                }
            });
        } else {
            this.employeeService.createEmployee(employee)
                .pipe(untilDestroyed(this)).subscribe({
                next: () => {
                    this.loadEmployees();
                    this.showEmployeeForm = false;
                    this.showMainInterface = true;
                    this.errorMessage = '';
                    this.isLoading = false;
                    this.modalService.showAlert(
                        `${this.translationService.translate('SUCCESS.MESSAGE')}`, 
                        this.translationService.translate('ADMIN.EMPLOYEE_CREATED_SUCCESS')
                    )
                        .pipe(untilDestroyed(this)).subscribe();
                },
                error: (error) => {
                    console.error(this.translationService.translate('CONSOLE.ERROR_CREATING_EMPLOYEE'), error);
                    this.errorMessage = error.message;
                    this.isLoading = false;
                }
            });
        }
    }

    public createPosition(): void {
        if (!this.authService.validateToken()) {
            this.router.navigate(['/login']);
            return;
        }

        if (this.positionForm.invalid) {
            this.markFormGroupTouched(this.positionForm);
            return;
        }

        const formValue = this.positionForm.value;
        
        this.isLoading = true;
        const position: IPosition = { name: formValue.name.trim() };

        this.employeeService.createPosition(position)
            .pipe(untilDestroyed(this)).subscribe({
            next: () => {
                this.loadPositions();
                this.positionForm.reset();
                this.showPositionForm = false;
                this.showMainInterface = true;
                this.errorMessage = '';
                this.isLoading = false;
                this.modalService.showAlert(
                    `${this.translationService.translate('SUCCESS.MESSAGE')}`, 
                    this.translationService.translate('ADMIN.POSITION_CREATED_SUCCESS')
                )
                    .pipe(untilDestroyed(this)).subscribe();
            },
            error: (error) => {
                console.error(this.translationService.translate('CONSOLE.ERROR_CREATING_POSITION'), error);
                this.errorMessage = error.message;
                this.isLoading = false;
            }
        });
    }

    public deletePosition(id: number): void {
        const position = this.positions.find(pos => pos.id === id);
        if (!position) return;

        const employeesWithThisPosition = this.employees.filter(emp => emp.position_id === id);

        if (employeesWithThisPosition.length > 0) {
            let employeeList = '';
            employeesWithThisPosition.forEach(emp => {
                employeeList += `• <strong>${this.translationService.translate('ADMIN.EMPLOYEE_ID')}</strong> ${emp.employee_id}, <strong>${this.translationService.translate('ADMIN.EMPLOYEE_FULL_NAME')}</strong> ${emp.last_name} ${emp.first_name} ${emp.middle_name || ''}<br>`;
            });

            let message = `<strong>${this.translationService.translate('ADMIN.POSITION_DELETE_ERROR_MESSAGE')} "${position.name}"!</strong>
      <br><br>
      <strong>${this.translationService.translate('ADMIN.POSITION_HAS_EMPLOYEES')}</strong>
      <br><br>
      ${employeeList}
      <br>
      <em>${this.translationService.translate('ADMIN.TRANSFER_EMPLOYEES_FIRST')}</em>
    `;
            this.modalService.showAlert(
                this.translationService.translate('ADMIN.POSITION_DELETE_ERROR_TITLE'), 
                message
            )
                .pipe(untilDestroyed(this)).subscribe();
            return;
        }

        const message = `${this.translationService.translate('ACTIONS.CONFIRM_DELETE')} <strong>"${position.name}"</strong>?`;

        this.modalService.showConfirm(
            this.translationService.translate('POSITION.DELETE'), 
            message, 
            this.translationService.translate('ACTIONS.DELETE'), 
            this.translationService.translate('ACTIONS.CANCEL')
        )
            .pipe(untilDestroyed(this)).subscribe(confirmed => {
                if (confirmed) {
                    this.employeeService.deletePosition(id).
                    pipe(untilDestroyed(this)).subscribe({
                        next: () => {
                            this.loadPositions();
                            this.errorMessage = '';
                        },
                        error: (error) => {
                            console.error(this.translationService.translate('CONSOLE.ERROR_DELETING_POSITION'), error);
                            this.errorMessage = error.message;
                        }
                    });
                }
            });
    }

    public logout(): void {
        this.authService.logout();
        this.router.navigate(['/employees']);
    }

    private markFormGroupTouched(formGroup: FormGroup): void {
        Object.keys(formGroup.controls).forEach(key => {
            const control = formGroup.get(key);
            if (control) {
                control.markAsTouched();
            }
        });
    }

    get employeeFormControls() {
        return this.employeeForm.controls;
    }

    get positionFormControls() {
        return this.positionForm.controls;
    }

    public isFieldInvalid(form: FormGroup, fieldName: string): boolean {
        const field = form.get(fieldName);
        return !!(field && field.invalid && (field.dirty || field.touched));
    }

    public getFieldError(form: FormGroup, fieldName: string): string {
        const field = form.get(fieldName);
        if (field && field.errors && (field.dirty || field.touched)) {
            if (field.errors['required']) {
                return this.translationService.translate('VALIDATORS.REQUIRED');
            }
            if (field.errors['email']) {
                return this.translationService.translate('VALIDATORS.EMAIL');
            }
            if (field.errors['minlength']) {
                return this.translationService.translate('VALIDATORS.MINLENGTH') + field.errors['minlength'].requiredLength;
            }
            if (field.errors['maxlength']) {
                return this.translationService.translate('VALIDATORS.MAXLENGTH') + field.errors['maxlength'].requiredLength;
            }
            if (field.errors['min']) {
                return this.translationService.translate('VALIDATORS.MIN') + field.errors['min'].min;
            }
            if (field.errors['max']) {
                return this.translationService.translate('VALIDATORS.MAX') + field.errors['max'].max;
            }
            if (field.errors['phoneFormat']) {
                return this.translationService.translate('VALIDATORS.PHONEFORMAT');
            }
            if (field.errors['invalidName']) {
                return this.translationService.translate('VALIDATORS.INVALIDNAME');
            }
        }
        return '';
    }

    public formatPhoneNumber(event: any): void {
        const input = event.target;
        let value = input.value.replace(/[^\d+]/g, '');
    
        if (value.startsWith('+375') && value.length > 4) {
            const numbers = value.slice(4).replace(/\D/g, '');
            if (numbers.length <= 2) {
                value = '+375(' + numbers;
            } else if (numbers.length <= 9) {
                value = '+375(' + numbers.slice(0, 2) + ')' + numbers.slice(2);
            } else {
                value = '+375(' + numbers.slice(0, 2) + ')' + numbers.slice(2, 9);
            }
        } else if (value.startsWith('+7') && value.length > 2) {
            const numbers = value.slice(2).replace(/\D/g, '');
            if (numbers.length <= 3) {
                value = '+7(' + numbers;
            } else if (numbers.length <= 10) {
                value = '+7(' + numbers.slice(0, 3) + ')' + numbers.slice(3);
            } else {
                value = '+7(' + numbers.slice(0, 3) + ')' + numbers.slice(3, 10);
            }
        }
        
        input.value = value;
        this.employeeForm.patchValue({ contact_phone: value });
    }
}