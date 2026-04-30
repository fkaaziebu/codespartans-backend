# Parenting Feature Integration
I think is best if this is added as a module under the src/modules folder and keep the entities under it

The parenting feature works this way (ui step flow): 
1. We have parents creating their account by providing the following informations
- First Name / Last Name
- Whatsapp Number
- Email address
- Password

2. When we hit the RegisterParent endpoint, it creates a parent with an unverified account, an email is sent with a 6 digit code sent to the parent email.
3. Registered Parent now adds children (student)
- Full Name
- Class (JHS 1, 2, 3 | SHS 1, 2, 3)
- Target Exam (BECE, WASSCE, depending on the selected class)
- School Name (PRESEC Legon, Achimota, Makrosec, etc)

A pin is generated for the children so they can use in logging in

## Dashboard Features for parenting
1. ListChildren -> Student[]: This list the children of the parent. This should be paginated
